import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  NotImplementedException,
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
// import { verificationTemplate } from 'src/utils/email.templates';
import { decodeJwtResponse } from 'src/utils/jwt.utils';
import { Invite } from 'src/invites/entities/invite.entity';
import { Organization } from 'src/organizations/entities/organization.entity';
import { AuditLogsSerivce } from 'src/audit-logs/audit-logs.service';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { OTPService } from 'src/otp/otp.service';
import { UserRoleEnum } from 'src/types/enums';
import { AuditLogs } from 'src/audit-logs/entities/audit-logs.entities';

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

    private readonly jwtService: JwtService,
    private readonly auditService: AuditLogsSerivce,
    private readonly otpService: OTPService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const existingUser = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });

      if (existingUser) throw new ConflictException('user already exists');

      const existingNumber = await this.userRepository.findOne({
        where: { phone_number: createUserDto.phone_number },
      });

      if (existingNumber)
        throw new ConflictException('phone number already taken');

      const find_invites = await this.inviteRepository.find({
        where: {
          sent_to: createUserDto.email,
        },
      });
      if (find_invites.length > 0)
        throw new ConflictException(
          `You've already been invited, Check your email!`,
        );

      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      createUserDto.password = hashedPassword;
      createUserDto.full_name = `${createUserDto.first_name} ${createUserDto.last_name}`;
      createUserDto.role = UserRoleEnum.OWNER;

      const otp = String(this.otpService.generateOTP());

      const create_user = this.userRepository.create({
        email: createUserDto.email,
        password: createUserDto.password,
        first_name: createUserDto.first_name,
        last_name: createUserDto.last_name,
        role: createUserDto.role,
        phone_number: createUserDto.phone_number,
        full_name: createUserDto.full_name,
        generated_otp: otp,
      });

      await this.otpService.sendSMSService(createUserDto.phone_number, otp);

      const user = await this.userRepository.save(create_user);

      const payload = { user_id: user.id, email: user.email };
      const access_token = this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '1d',
      });

      const new_admin_group = await this.groupsRepository.save(
        this.groupsRepository.create({
          name: 'Admin',
          created_by: user,
        }),
      );

      const new_associate_group = await this.groupsRepository.save(
        this.groupsRepository.create({
          name: 'Associates',
          created_by: user,
        }),
      );
      const new_org = this.orgRepository.create({
        name: 'ORG-' + user.id.slice(0, 5),
        creator: user,
        groups: [new_admin_group, new_associate_group],
        users: [],
        invites: [],
      });

      const saveOrg = await this.orgRepository.save(new_org);

      await this.folderRepository.save({
        name: 'Home',
        parent_folder_id: null,
        tree_index: '1',
        users: [user],
        organization: saveOrg,
        absolute_path: '/Home',
      });

      // const mail = {
      //   to: user.email,
      //   subject: 'Verify Email',
      //   from:
      //     String(process.env.VERIFIED_SENDER_EMAIL) || 'waleed@lockroom.com',
      //   text: 'Verify',
      //   html: verificationTemplate(
      //     String(user.first_name).toUpperCase(),
      //     `${process.env.FE_HOST}/thank-you/verify-email?customer=${access_token}`,
      //   ),
      // };

      // await sendEmailUtil(mail);

      return {
        user: { ...user, organization_created: saveOrg },
        access_token,
        files_count: 1,
        id: user.id,
        organizations: [saveOrg],
      };
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
          'organizations_added_in.groups',
          'organization_created.groups',
        ],
        where: { email },
      });

      const orgs = [];

      if (!user) {
        throw new UnauthorizedException('Invalid Credentials'); // Throw UnauthorizedException
      }
      if (user.sso_login && user.sso_type == 'google')
        throw new UnauthorizedException('Login with Google');
      const passwordMatched = await bcrypt.compare(password, user.password);
      if (!passwordMatched) {
        throw new UnauthorizedException('Invalid Credentials'); // Throw UnauthorizedException
      }
      if (user.role == UserRoleEnum.ADMIN || user.role == UserRoleEnum.OWNER) {
        const payload = {
          user_id: user.id,
          email: user.email,
          role: user.role,
        };
        const accessToken = this.jwtService.sign(payload, {
          secret: process.env.JWT_SECRET,
          expiresIn: '1d',
        });
        if (user.organization_created) {
          orgs.push(user.organization_created.id);
        }
        user.organizations_added_in.map((org) => {
          orgs.push(org.id);
        });

        const organizations = await this.orgRepository.find({
          relations: ['users', 'creator'],
          where: {
            id: In(orgs),
          },
        });

        if (user.two_fa_type == 'sms') {
          const otp = this.otpService.generateOTP();
          user.generated_otp = String(otp);
          await this.otpService.sendSMSService(user.phone_number, String(otp));
        }

        await this.userRepository.save(user);

        return {
          access_token: accessToken,
          is_phone_number_verified: user.is_phone_number_verified,
          id: user.id,
          user,
          organizations,
        };
      }
      if (user.role == UserRoleEnum.GUEST) {
        const payload = {
          user_id: user.id,
          email: user.email,
          role: user.role,
        };
        const accessToken = this.jwtService.sign(payload, {
          secret: process.env.JWT_SECRET,
          expiresIn: '1d',
        });
        user.organizations_added_in.map((org) => {
          orgs.push(org.id);
        });

        const organizations = await this.orgRepository.find({
          relations: ['users', 'creator'],
          where: {
            id: In(orgs),
          },
        });

        if (user.two_fa_type == 'sms') {
          const otp = this.otpService.generateOTP();
          user.generated_otp = String(otp);
          await this.otpService.sendSMSService(user.phone_number, String(otp));
        }

        await this.userRepository.save(user);

        return {
          access_token: accessToken,
          is_phone_number_verified: user.is_phone_number_verified,
          id: user.id,
          user,
          organizations,
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

      if (!user) throw new UnauthorizedException('token invalid');

      const find_user = await this.userRepository.findOne({
        relations: ['organizations_added_in', 'organization_created'],
        where: {
          email: user.email,
        },
      });

      if (find_user) {
        const orgs = [];
        if (find_user.role == UserRoleEnum.GUEST) {
          await this.auditService.create(
            null,
            find_user.id,
            find_user.organizations_added_in[0].id,
            'login',
          );
        }
        orgs.push(find_user?.organization_created?.id);
        find_user.organizations_added_in.map((org) => {
          orgs.push(org.id);
        });
        const organizations = await this.orgRepository.find({
          relations: ['users', 'creator'],
          where: {
            id: In(orgs),
          },
        });
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

        // this,this.folderRepository.

        const payload = {
          user_id: find_user.id,
          email: find_user.email,
          role: find_user.role,
        };
        const accessToken = this.jwtService.sign(payload, {
          secret: process.env.JWT_SECRET,
          expiresIn: '1d',
        });
        return {
          access_token: accessToken,
          is_phone_number_verified: find_user.is_phone_number_verified,
          folders: query,
          files_count: query.length,
          sub_folder_count: query1,
          id: find_user.id,
          user: find_user,
          organizations,
        };
      }
      const find_invites = await this.inviteRepository.find({
        where: {
          sent_to: user?.email,
        },
      });
      if (find_invites.length > 0)
        throw new ConflictException(
          `You've already been invited, Check your email!`,
        );

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
        .where('user.id = :user_id', { user_id: new_user.id })
        // .andWhere('folder.organization.id = :organizationId', {
        //   organizationId: organization_id,
        // })
        .groupBy('folder.id, user.id')
        .orderBy('folder.createdAt', 'ASC')
        .getRawMany();

      const new_group_admin = await this.groupsRepository.save(
        this.groupsRepository.create({
          name: 'Admin',
          created_by: new_user,
        }),
      );
      const new_group_associates = await this.groupsRepository.save(
        this.groupsRepository.create({
          name: 'Associates',
          created_by: new_user,
        }),
      );

      const saveOrg = await this.orgRepository.save(
        this.orgRepository.create({
          name: 'ORG-' + new_user.id.slice(0, 5),
          creator: saved_user,
          groups: [new_group_admin, new_group_associates],
          users: [],
          invites: [],
        }),
      );

      const payload = { user_id: new_user.id, email: new_user.email };
      const access_token = this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '1d',
      });

      const folder = await this.folderRepository.save({
        name: 'Home',
        parent_folder_id: null,
        tree_index: '1',
        users: [new_user],
        organization: saveOrg,
        absolute_path: '/Home',
      });
      return {
        access_token,
        folders: [folder],
        files_count: 1,
        id: new_user.id,
        sub_folder_count: query1,
        user: { ...new_user, organization_created: saveOrg },
        organizations: [saveOrg],
      };
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
          where: {
            id: user_id,
          },
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
        relations: ['organizations_added_in', 'organization_created'],
        where: {
          id: user_id,
        },
      });

      if (!find_user) {
        throw new NotFoundException('user not found');
      }
      const orgs = [];
      if (
        find_user.role == UserRoleEnum.ADMIN ||
        find_user.role == UserRoleEnum.OWNER
      )
        orgs.push(find_user.organization_created);
      find_user.organizations_added_in.map((org) => {
        orgs.push(org);
      });

      return { findUser: find_user, organizations: orgs };
    } catch (error) {
      console.log(error, 'err');
      throw error;
    }
  }

  async findOne(where: any) {
    return await this.userRepository.findOne({
      relations: ['organization_created', 'organizations_added_in', 'groups'],
      where: where,
    });
  }

  async getAllGroups(organization_id: string,user_id: string) {
    try {
      if (!user_id) throw new NotFoundException('Missing Fields');
      const find_user = await this.userRepository.findOne({
        relations: ['groups'],
        where: {
          id: user_id,
        },
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
          where: { organization: {
            id: organization_id
          } },
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
      relations: ['organizations_added_in', 'groups'],
      where: {
        id: user_id,
      },
    });
    if (find_user && find_user.generated_otp.length > 0) {
      if (find_user.generated_otp == otp) {
        if (find_user.role == UserRoleEnum.GUEST) {
          // console.log(find_user.generated_otp == otp,'go bad')
          const audit = this.auditRepository.create({
            file: null,
            organization: find_user.organizations_added_in[0],
            user: find_user,
            group: find_user.groups[0],
            type: 'login',
          });
          // console.log(audit,'auddd')
          const add_audit_record = await this.auditRepository.save(audit);
          if (add_audit_record) {
            // console.log('hereee in audit')
            return {
              success: true,
            };
          }
        }
        return {
          success: true,
        };
      }
      console.log('heeress');
      return new UnauthorizedException('OTP is invalid');
    } else {
      return new NotFoundException('user not found');
    }
  }

  async verifyPhone(otp: string, user_id: string) {
    const find_user = await this.userRepository.findOne({
      where: {
        id: user_id,
      },
    });
    if (find_user && find_user.generated_otp.length > 0) {
      if (find_user.generated_otp == otp) {
        console.log('here recognized');
        find_user.is_phone_number_verified = true;
        await this.userRepository.save(find_user);
        console.log(find_user);
        return {
          success: true,
        };
      }
      return new UnauthorizedException('OTP is invalid');
    } else {
      return new NotFoundException('user not found');
    }
  }

  async resendOTP(user_id: string) {
    const find_user = await this.userRepository.findOne({
      where: {
        id: user_id,
      },
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
      where: {
        id: user_id,
      },
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
    // console.log(code, 'code');
    const find_user = await this.userRepository.findOne({
      where: {
        id: user_id,
      },
    });
    // console.log(find_user.qr_code_secret, secret);
    const verify = authenticator.verify({
      token: code,
      secret: find_user.qr_code_secret,
    });
    // console.log(verify, 'ver');
    if (verify) {
      find_user.two_fa_type = 'authenticator';
      await this.userRepository.save(find_user);
      return { success: verify };
    }
    return { success: false };
  }

  async setAuthenticator(two_fa_type: string, user_id: string) {
    const find_user = await this.userRepository.findOne({
      where: {
        id: user_id,
      },
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
      ssl: process.env.NODE_ENV == 'development'
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
}
