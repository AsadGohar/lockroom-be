import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  NotImplementedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtService } from '@nestjs/jwt';
import { Folder } from 'src/folders/entities/folder.entity';
import { Group } from 'src/groups/entities/group.entity';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { decodeJwtResponse } from 'src/utils/jwt.utils';
import { Invite } from 'src/invites/entities/invite.entity';
import { Organization } from 'src/organizations/entities/organization.entity';
import { AuditLogsSerivce } from 'src/audit-logs/audit-logs.service';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { OTPService } from 'src/otp/otp.service';
import { SubscriptionTypeEnum, UserRoleEnum } from 'src/types/enums';
import { AuditLogs } from 'src/audit-logs/entities/audit-logs.entities';
import { SubscriptionsService } from 'src/subscription-plans/subscription-plans.service';
import {
  generateRandomEmail,
  getNextDate,
  isDateMoreThanSubscription,
} from 'src/utils/converts.utils';
import { signupTemplate } from 'src/utils/email.templates';
import { EmailService } from 'src/email/email.service';
import { Room } from 'src/rooms/entities/room.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Folder)
    private readonly folderRepository: Repository<Folder>,
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,
    @InjectRepository(Invite)
    private readonly inviteRepository: Repository<Invite>,
    @InjectRepository(AuditLogs)
    private readonly auditRepository: Repository<AuditLogs>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,

    private readonly jwtService: JwtService,
    private readonly auditService: AuditLogsSerivce,
    private readonly otpService: OTPService,
    private readonly subscriptionService: SubscriptionsService,
    private readonly emailService: EmailService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const existing_user = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });

      if (existing_user) throw new ConflictException('user already exists');

      const existing_number = await this.userRepository.findOne({
        where: { phone_number: createUserDto.phone_number },
      });

      if (existing_number)
        throw new ConflictException('phone number already taken');

      const find_invites = await this.inviteRepository.find({
        where: { sent_to: createUserDto.email },
      });
      if (find_invites.length > 0)
        throw new ConflictException(
          `You've already been invited, Check your email!`,
        );

      createUserDto.full_name = `${createUserDto.first_name} ${createUserDto.last_name}`;
      createUserDto.role = UserRoleEnum.OWNER;

      const find_subscription = await this.subscriptionService.findOneByType(
        SubscriptionTypeEnum.TRIAL,
      );

      const create_user = this.userRepository.create({
        email: createUserDto.email,
        first_name: createUserDto.first_name,
        last_name: createUserDto.last_name,
        role: createUserDto.role,
        phone_number: createUserDto.phone_number,
        full_name: createUserDto.full_name,
        is_email_verified: false,
      });

      const user = await this.userRepository.save(create_user);

      const payload = { user_id: user.id, email: user.email };
      const access_token = this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '1d',
      });

      await this.sendConfirmPasswordEmail(createUserDto.email, access_token);

      const new_admin_group = await this.groupsRepository.save(
        this.groupsRepository.create({ name: 'Admin', created_by: user }),
      );

      const new_associate_group = await this.groupsRepository.save(
        this.groupsRepository.create({ name: 'Associates', created_by: user }),
      );

      const dashboard = await this.createFakeDashBoard(user);

      const calculate_trial_end_date = getNextDate(find_subscription.days);

      const new_org = this.orgRepository.create({
        name: 'ORG-' + user.id.slice(0, 5),
        creator: user,
        subscription: find_subscription,
        subscription_start_date: new Date(),
        subscription_end_date: calculate_trial_end_date,
      });

      const save_org = await this.orgRepository.save(new_org);
      const room = await this.roomRepository.save(
        this.roomRepository.create({
          name: 'Room-' + save_org.id.slice(0, 5),
          organization: save_org,
          groups: [new_admin_group, new_associate_group, ...dashboard.groups],
          invites: [],

          users: [user, ...dashboard.users],
        }),
      );

      const folder = await this.folderRepository.save({
        name: 'Home',
        parent_folder_id: null,
        tree_index: '1',
        users: [user],
        organization: save_org,
        absolute_path: '/Home',
        display_name: 'Home',
        display_tree_index: '1',
        absolute_path_ids: '',
        color: '#fec81e',
        room,
      });

      if (folder) {
        await this.folderRepository.update(folder.id, {
          absolute_path_ids: `/${folder.id}`,
        });

        return {
          success: true,
        };
      } else {
        throw new BadRequestException(
          'Something went wrong while creating folders',
        );
      }
    } catch (error) {
      console.log(error, 'err');
      throw new InternalServerErrorException(
        error.message || 'failed to create user',
      );
    }
  }

  async loginUser(email: string, password: string) {
    try {
      const user = await this.userRepository.findOne({
        relations: [
          'organization',
          'organization_created',
          'organization.rooms.groups',
          'organization.subscription',
          'groups',
          'room',
        ],
        where: { email },
      });

      const allowed_rooms = [];

      console.log(user,'dasssss')

      if (!user) {
        throw new UnauthorizedException('Invalid Credentials'); // Throw UnauthorizedException
      }

      const organization = await this.orgRepository.findOne({
        relations: ['users', 'creator', 'subscription', 'rooms'],
        where: {
          id:
            user.role == UserRoleEnum.OWNER
              ? user.organization_created.id
              : user.organization.id,
        },
      });

      if (
        isDateMoreThanSubscription(
          organization.subscription_end_date,
          organization.subscription.days,
        )
      ) {
        throw new UnauthorizedException('Your trial has expired');
      }

      if (user.sso_login && user.sso_type == 'google') {
        throw new UnauthorizedException('Login with Google');
      }

      const password_matched = await bcrypt.compare(password, user.password);

      if (!password_matched) {
        throw new UnauthorizedException('Invalid Credentials');
      }
      if (user.role == UserRoleEnum.ADMIN || user.role == UserRoleEnum.OWNER) {
        const payload = {
          user_id: user.id,
          email: user.email,
          role: user.role,
        };
        const access_token = this.jwtService.sign(payload, {
          secret: process.env.JWT_SECRET,
          expiresIn: '1d',
        });

        organization.rooms.map((room) => {
          allowed_rooms.push(room);
        });

        if (user.two_fa_type == 'sms') {
          const otp = this.otpService.generateOTP();
          user.generated_otp = String(otp);
          await this.otpService.sendSMSService(user.phone_number, String(otp));
        }

        await this.userRepository.save(user);

        return {
          access_token,
          is_phone_number_verified: user.is_phone_number_verified,
          id: user.id,
          user,
          organization,
          rooms: allowed_rooms,
        };
      }
      if (user.role == UserRoleEnum.GUEST) {
        if (user.groups.length == 0) {
          throw new UnauthorizedException(
            'You have not been added to any group, try contacting the room owner',
          );
        }
        const payload = {
          user_id: user.id,
          email: user.email,
          role: user.role,
        };
        const access_token = this.jwtService.sign(payload, {
          secret: process.env.JWT_SECRET,
          expiresIn: '1d',
        });

        if (user.two_fa_type == 'sms') {
          const otp = this.otpService.generateOTP();
          user.generated_otp = String(otp);
          await this.otpService.sendSMSService(user.phone_number, String(otp));
        }
        await this.userRepository.save(user);
        console.log(user.room,'dsaads')
        return {
          access_token,
          is_phone_number_verified: user.is_phone_number_verified,
          id: user.id,
          user,
          organization,
          rooms: [user.room],
        };
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async loginWithGoogle(jwt_token: string) {
    try {
      const user = decodeJwtResponse(jwt_token);

      const allowed_rooms = [];

      if (!user) throw new UnauthorizedException('token invalid');

      const find_user = await this.userRepository.findOne({
        relations: [
          'organization.rooms.groups',
          'organization.subscription',
          'organization_created.subscription',
          'groups',
          'room',
        ],
        where: { email: user.email },
      });

      console.log(find_user,'dsdadadas')

      if (find_user) {
        if (
          isDateMoreThanSubscription(
            find_user.role == UserRoleEnum.OWNER ? find_user.organization_created.subscription_end_date:find_user.organization.subscription_end_date,
             find_user.role == UserRoleEnum.OWNER ? find_user.organization_created.subscription.days:find_user.organization.subscription.days,
          )
        ) {
          throw new UnauthorizedException('Your trial has expired');
        }
        const organization = await this.orgRepository.findOne({
          relations: ['users', 'creator', 'subscription', 'rooms'],
          where: {
            id:
              find_user.role == UserRoleEnum.OWNER
                ? find_user.organization_created.id
                : find_user.organization.id,
          },
        });

        console.log(organization,'dasdasasss')

        if (find_user.role == UserRoleEnum.GUEST) {
          await this.auditService.create(
            null,
            find_user.id,
            find_user.room.id,
            'login',
          );
          organization.rooms.map((room) => {
            allowed_rooms.push(room);
          });
        }

        const query = await this.folderRepository
          .createQueryBuilder('folder')
          .leftJoinAndSelect('folder.users', 'user')
          .where('user.id = :user_id', { user_id: find_user.id })
          .getMany();
        const query1 = await this.folderRepository
          .createQueryBuilder('folder')
          .leftJoinAndSelect('folder.users', 'user')
          .leftJoin('folder.sub_folders', 'sub_folder')
          .addSelect('COUNT(DISTINCT sub_folder.id)', 'sub_folder_count')
          .where('user.id = :user_id', { user_id: find_user.id })
          .groupBy('folder.id, user.id')
          .orderBy('folder.createdAt', 'ASC')
          .getRawMany();

        const payload = {
          user_id: find_user.id,
          email: find_user.email,
          role: find_user.role,
        };
        const access_token = this.jwtService.sign(payload, {
          secret: process.env.JWT_SECRET,
          expiresIn: '1d',
        });
        return {
          access_token: access_token,
          is_phone_number_verified: find_user.is_phone_number_verified,
          folders: query,
          files_count: query.length,
          sub_folder_count: query1,
          id: find_user.id,
          user: find_user,
          organization,
          rooms: find_user.role == UserRoleEnum.OWNER ? organization.rooms : allowed_rooms,
        };
      }
      const find_invites = await this.inviteRepository.find({
        where: { sent_to: user?.email },
      });
      if (find_invites.length > 0)
        throw new ConflictException(
          `You've already been invited, Check your email!`,
        );

      const find_subscription = await this.subscriptionService.findOneByType(
        SubscriptionTypeEnum.TRIAL,
      );

      // console.log(find_subscription, 'subbbb');

      const calculate_trial_end_date = getNextDate(find_subscription.days);

      const new_user = this.userRepository.create({
        email: user.email,
        full_name: `${user.given_name} ${user.family_name}`,
        first_name: user.given_name,
        last_name: user.family_name,
        display_picture_url: user.picture,
        sso_login: true,
        sso_type: 'google',
      });
      const saved_user = await this.userRepository.save(new_user);

      const query1 = await this.folderRepository
        .createQueryBuilder('folder')
        .leftJoinAndSelect('folder.users', 'user')
        .leftJoin('folder.sub_folders', 'sub_folder')
        .addSelect('COUNT(DISTINCT sub_folder.id)', 'sub_folder_count')
        .where('user.id = :user_id', { user_id: saved_user.id })
        .groupBy('folder.id, user.id')
        .orderBy('folder.createdAt', 'ASC')
        .getRawMany();

      const new_admin_group = await this.groupsRepository.save(
        this.groupsRepository.create({ name: 'Admin', created_by: saved_user }),
      );
      const new_associate_group = await this.groupsRepository.save(
        this.groupsRepository.create({
          name: 'Associates',
          created_by: saved_user,
        }),
      );

      const dashboard = await this.createFakeDashBoard(user);

      const save_org = await this.orgRepository.save(
        this.orgRepository.create({
          name: 'ORG-' + saved_user.id.slice(0, 5),
          creator: saved_user,
          subscription: find_subscription,
          subscription_start_date: new Date(),
          subscription_end_date: calculate_trial_end_date,
        }),
      );

      const room = await this.roomRepository.save(
        this.roomRepository.create({
          name: 'Room-' + save_org.id.slice(0, 5),
          organization: save_org,
          groups: [new_admin_group, new_associate_group, ...dashboard.groups],
          invites: [],
          users: [saved_user, ...dashboard.users],
        }),
      );

      const payload = { user_id: saved_user.id, email: saved_user.email };
      const access_token = this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '1d',
      });

      const folder = await this.folderRepository.save({
        name: 'Home',
        parent_folder_id: null,
        tree_index: '1',
        users: [saved_user],
        organization: save_org,
        absolute_path: '/Home',
        display_name: 'Home',
        display_tree_index: '1',
        absolute_path_ids: '',
        color: '#fec81e',
        room,
      });
      if (folder) {
        await this.folderRepository.update(folder.id, {
          absolute_path_ids: `/${folder.id}`,
        });
        return {
          access_token,
          folders: [folder],
          files_count: 1,
          id: saved_user.id,
          sub_folder_count: query1,
          user: { ...new_user, organization_created: save_org },
          organization: save_org,
          rooms: [room],
        };
      } else {
        throw new BadRequestException(
          'Something went wrong while creating folders',
        );
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        error.message || 'failed to create user',
      );
    }
  }

  async verifyEmail(user_id: string) {
    try {
      if (user_id) {
        const find_user = await this.userRepository.findOne({
          where: { id: user_id },
        });
        if (!find_user) throw new NotFoundException('user not found');
        find_user.is_email_verified = true;
        return await this.userRepository.save(find_user);
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getUserByToken(user_id: string) {
    try {
      if (!user_id) throw new NotFoundException('Missing Fields');
      const find_user = await this.userRepository.findOne({
        relations: [
          'organization.rooms.groups',
          'organization_created',
          'organization.subscription',
          'organization',
          'groups',
          'room',
        ],
        where: { id: user_id },
      });

      if (!find_user) {
        throw new NotFoundException('user not found');
      }

      const organization = await this.orgRepository.findOne({
        relations: ['users', 'creator', 'subscription', 'rooms'],
        where: {
          id:
            find_user.role == UserRoleEnum.OWNER
              ? find_user.organization_created.id
              : find_user.organization.id,
        },
      });

      console.log(organization)

      if (
        isDateMoreThanSubscription(
          organization.subscription_end_date,
          organization.subscription.days,
        )
      ) {
        throw new UnauthorizedException('Your trial has expired');
      }

      const orgs = [];
      if (
        find_user.role == UserRoleEnum.ADMIN ||
        find_user.role == UserRoleEnum.OWNER
      ){
        orgs.push(find_user.organization_created);
      }
      else {
        orgs.push(find_user.organization);

      }

      console.log(orgs,'dasdas')

      return { findUser: find_user, organizations: orgs };
    } catch (error) {
      console.log(error, 'err');
      throw error;
    }
  }

  async findOne(where: any) {
    return await this.userRepository.findOne({
      relations: [
        'organization_created',
        'organization',
        'groups',
        'organization.rooms',
        'organization_created.rooms',
      ],
      where: where,
    });
  }

  async getAllGroups(room_id: string, user_id: string) {
    try {
      if (!user_id) throw new NotFoundException('Missing Fields');
      const find_user = await this.userRepository.findOne({
        relations: ['groups'],
        where: { id: user_id },
      });
      if (!find_user)
        throw new NotFoundException({
          status: 404,
          message: 'user not found',
        });
      if (
        find_user.role == UserRoleEnum.ADMIN ||
        find_user.role == UserRoleEnum.OWNER
      ) {
        return await this.groupsRepository.find({
          where: { room: { id: room_id } },
        });
      }
      return find_user.groups;
    } catch (error) {
      console.log(error, 'in err lol');
      throw Error(error);
    }
  }

  async findAll() {
    try {
      return await this.userRepository.find();
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async verifyOTP(otp: string, user_id: string) {
    const find_user = await this.userRepository.findOne({
      relations: [
        'organization.rooms.groups',
        'organization.subscription',
        'groups',
        'room',
      ],
      where: { id: user_id },
    });
    if (find_user && find_user.generated_otp.length > 0) {
      if (find_user.generated_otp == otp) {
        if (find_user.role == UserRoleEnum.GUEST) {
          const audit = this.auditRepository.create({
            file: null,
            room: find_user.room[0],
            user: find_user,
            group: find_user.groups[0],
            type: 'login',
          });
          const add_audit_record = await this.auditRepository.save(audit);
          if (add_audit_record) {
            return { success: true };
          }
        }
        return { success: true };
      }
      return new UnauthorizedException('OTP is invalid');
    } else {
      return new NotFoundException('user not found');
    }
  }

  async verifyPhone(otp: string, user_id: string) {
    const find_user = await this.userRepository.findOne({
      where: { id: user_id },
    });
    if (find_user && find_user.generated_otp.length > 0) {
      if (find_user.generated_otp == otp) {
        find_user.is_phone_number_verified = true;
        await this.userRepository.save(find_user);
        console.log(find_user);
        return { success: true };
      }
      return new UnauthorizedException('OTP is invalid');
    } else {
      return new NotFoundException('user not found');
    }
  }

  async resendOTP(user_id: string) {
    const find_user = await this.userRepository.findOne({
      where: { id: user_id },
    });
    if (find_user) {
      const otp = String(this.otpService.generateOTP());
      find_user.generated_otp = otp;
      await this.userRepository.save(find_user);
      await this.otpService.sendSMSService(find_user.phone_number, String(otp));
    } else {
      return new NotFoundException('user not found');
    }
  }

  async generateQRcode(user_id: string) {
    const secret = authenticator.generateSecret(20);
    const find_user = await this.userRepository.findOne({
      where: { id: user_id },
    });
    const otpAuthURL = authenticator.keyuri(
      find_user.email,
      'LockRoom',
      secret,
    );
    const qrcode = await toDataURL(otpAuthURL);
    find_user.qr_code_secret = secret;
    await this.userRepository.save(find_user);
    return qrcode;
  }

  async verifyAuthenticatorCode(code: string, user_id: string) {
    const find_user = await this.userRepository.findOne({
      where: { id: user_id },
    });
    const verify = authenticator.verify({
      token: code,
      secret: find_user.qr_code_secret,
    });
    if (verify) {
      find_user.two_fa_type = 'authenticator';
      await this.userRepository.save(find_user);
      return { success: verify };
    }
    return { success: false };
  }

  async setAuthenticator(two_fa_type: string, user_id: string) {
    const find_user = await this.userRepository.findOne({
      where: { id: user_id },
    });
    if (find_user) {
      find_user.two_fa_type = two_fa_type;
      const saved_user = await this.userRepository.save(find_user);
      return { user: saved_user };
    }
  }

  async truncateUserTable() {
    const entityManager = await new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      ssl:
        process.env.NODE_ENV == 'development'
          ? false
          : {
              rejectUnauthorized: false,
            },
    }).initialize();

    try {
      await entityManager.manager.query('TRUNCATE TABLE "user" CASCADE');
      await entityManager.manager.query('TRUNCATE TABLE "permission" CASCADE');
      console.log('DB CLEARED');
      return { success: true };
    } catch (error) {
      console.error('Error truncating user table:', error);
      throw Error(error);
    }
  }

  async updateViewType(view_type: string, user_id: string) {
    const update_user = await this.userRepository.update(user_id, {
      view_type,
    });
    if (update_user.affected > 0) {
      const user = await this.userRepository.findOne({
        where: { id: user_id },
      });
      return user;
    } else {
      throw new NotImplementedException(
        'Something went wrong while updating user',
      );
    }
  }

  private async createFakeDashBoard(user: User) {
    const internal_team_group = await this.groupsRepository.save(
      this.groupsRepository.create({
        name: 'Internal Team',
        created_by: user,
      }),
    );
    const buyer_one_group = await this.groupsRepository.save(
      this.groupsRepository.create({
        name: 'Buyer 1',
        created_by: user,
      }),
    );
    const buyer_two_group = await this.groupsRepository.save(
      this.groupsRepository.create({
        name: 'Buyer 2',
        created_by: user,
      }),
    );
    const legal_group = await this.groupsRepository.save(
      this.groupsRepository.create({
        name: 'Legal Group',
        created_by: user,
      }),
    );
    const groups = [
      internal_team_group,
      buyer_one_group,
      buyer_two_group,
      legal_group,
    ];

    const users = await this.addFakeUsers(groups);

    return {
      groups,
      users,
    };
  }

  private async addFakeUsers(groups: Group[]) {
    const fake_user_one = await this.userRepository.save(
      this.userRepository.create({
        full_name: 'Bob Smith',
        first_name: 'Bob',
        last_name: 'Smith',
        password: '12345678',
        email: generateRandomEmail(),
        is_email_verified: true,
        role: UserRoleEnum.GUEST,
        is_phone_number_verified: true,
        groups: [groups[0]],
      }),
    );

    const fake_user_two = await this.userRepository.save(
      this.userRepository.create({
        full_name: 'Ben Franklin',
        first_name: 'Ben',
        last_name: 'Franklin',
        password: '123456789',
        email: generateRandomEmail(),
        is_email_verified: true,
        role: UserRoleEnum.GUEST,
        is_phone_number_verified: true,
        groups: [groups[1]],
      }),
    );

    const fake_user_three = await this.userRepository.save(
      this.userRepository.create({
        full_name: 'Jill Johnson',
        first_name: 'Jill',
        last_name: 'Johnson',
        password: '12345678910',
        email: generateRandomEmail(),
        is_email_verified: true,
        role: UserRoleEnum.GUEST,
        is_phone_number_verified: true,
        groups: [groups[2]],
      }),
    );

    const fake_user_four = await this.userRepository.save(
      this.userRepository.create({
        full_name: 'Cindy Lou',
        first_name: 'Cindy',
        last_name: 'Lou',
        password: '12345678910',
        email: generateRandomEmail(),
        is_email_verified: true,
        role: UserRoleEnum.GUEST,
        is_phone_number_verified: true,
        groups: [groups[3]],
      }),
    );

    const users = [
      fake_user_one,
      fake_user_two,
      fake_user_three,
      fake_user_four,
    ];

    return users;
  }

  async sendConfirmPasswordEmail(email: string, access_token: string) {
    const link = `${process.env.FE_HOST}/authentication/create-password?confirm=${access_token}`;
    const mail = {
      to: email,
      subject: 'LockRoom',
      from: String(process.env.VERIFIED_SENDER_EMAIL) || 'waleed@lockroom.com',
      text: 'Greetings',
      html: signupTemplate(link),
    };
    return this.emailService.send(mail);
  }

  async updatePassword(user_id: string, password: string) {
    console.log(password, 'dasdas');
    const hashed_password = await bcrypt.hash(password, 10);
    const update_password = await this.userRepository.update(
      {
        id: user_id,
      },
      {
        password: hashed_password,
      },
    );

    if (update_password.affected > 0) {
      return {
        sucess: true,
      };
    }
  }

  async createNewRoom(
    room_name: string,
    organization_id: string,
    user_id: string,
  ) {
    try {
      const user = await this.userRepository.findOne({
        where: {
          id: user_id,
        },
      });

      if (!user) throw new NotFoundException('user not found');

      const organization = await this.orgRepository.findOne({
        relations: ['rooms'],
        where: {
          id: organization_id,
        },
      });

      if (!organization) throw new NotFoundException('organization not found');

      const new_admin_group = await this.groupsRepository.save(
        this.groupsRepository.create({ name: 'Admin', created_by: user }),
      );

      const new_associate_group = await this.groupsRepository.save(
        this.groupsRepository.create({ name: 'Associates', created_by: user }),
      );

      const dashboard = await this.createFakeDashBoard(user);

      const room = await this.roomRepository.save(
        this.roomRepository.create({
          name: room_name,
          organization: organization,
          groups: [new_admin_group, new_associate_group, ...dashboard.groups],
          invites: [],
          users: [user, ...dashboard.users],
        }),
      );

      const folder = await this.folderRepository.save({
        name: 'Home',
        parent_folder_id: null,
        tree_index: '1',
        users: [user],
        organization: organization,
        absolute_path: '/Home',
        display_name: 'Home',
        display_tree_index: '1',
        absolute_path_ids: '',
        color: '#fec81e',
        room,
      });

      if (folder) {
        await this.folderRepository.update(folder.id, {
          absolute_path_ids: `/${folder.id}`,
        });
        const rooms = await this.roomRepository.find({
          where: {
            organization: {
              id: organization_id,
            },
          },
        });
        return {
          success: true,
          rooms,
        };
      } else {
        throw new BadRequestException(
          'Something went wrong while creating folders',
        );
      }
    } catch (error) {
      console.log(error, 'err');
      throw new InternalServerErrorException(
        error.message || 'failed to create user',
      );
    }
  }

  async getRoomsByUserId(organization_id:string,user_id: string) {
    try {
      const user = await this.userRepository.findOne({
        relations: ['room'],
        where: {
          id: user_id,
        },
      });

      const organization = await this.orgRepository.findOne({
        relations: ['rooms'],
        where: {
          id: organization_id,
        },
      });

      console.log(organization,'dsadas')

      if (!user) throw new NotFoundException('user not found');

      if (
        user.role === UserRoleEnum.ADMIN ||
        user.role === UserRoleEnum.OWNER
      ) {
        return {
          rooms: organization.rooms,
        };
      } else {
        return {
          rooms: [user.room],
        };
      }
    } catch (error) {
      console.log(error, 'err');
      throw new InternalServerErrorException(
        error.message || 'failed to create user',
      );
    }
  }
}
