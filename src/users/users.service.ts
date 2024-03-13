import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtService } from '@nestjs/jwt';
import { Folder } from 'src/folders/entities/folder.entity';
import { Group } from 'src/groups/entities/group.entity';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { verificationTemplate } from 'src/utils/email.templates';
import { decodeJwtResponse } from 'src/utils/jwt.utils';
import { Invite } from 'src/invites/entities/invite.entity';
import { Organization } from 'src/organizations/entities/organization.entity';
import { getMetadataArgsStorage } from 'typeorm';
import { File } from 'src/files/entities/file.entity';
import { formatBytes } from 'src/utils/converts.utils';
// import { sendSMS } from 'src/utils/otp.utils';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    @InjectRepository(Folder)
    private readonly folderRepository: Repository<Folder>,
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,
    @InjectRepository(Invite)
    private readonly inviteRepository: Repository<Invite>,
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    // console.log('here,in ceeate');
    // await sendSMS(createUserDto.phone_number)
    try {
      const existingUser = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });

      if (existingUser) throw new ConflictException('user already exists');

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
      createUserDto.role = 'admin';

      const create_user = this.userRepository.create({
        email: createUserDto.email,
        password: createUserDto.password,
        first_name: createUserDto.first_name,
        last_name: createUserDto.last_name,
        role: createUserDto.role,
        phone_number: createUserDto.phone_number,
        full_name: createUserDto.full_name,
      });

      const user = await this.userRepository.save(create_user);

      const payload = { user_id: user.id, email: user.email };
      const access_token = this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '1d',
      });

      const new_group = this.groupsRepository.create({
        name: 'Admin',
        createdBy: user,
      });

      const saved_group = await this.groupsRepository.save(new_group);
      const new_org = this.orgRepository.create({
        name: 'ORG-' + user.id.slice(0, 5),
        creator: user,
        groups: [saved_group],
        users: [],
        invites: [],
      });
      console.log('here1', new_org);

      const saveOrg = await this.orgRepository.save(new_org);
      console.log('here2', saveOrg);

      const folder = await this.folderRepository.save({
        name: 'Home',
        parent_folder_id: null,
        tree_index: '1',
        users: [user],
        organization: saveOrg,
      });

      const query1 = await this.folderRepository
        .createQueryBuilder('folder')
        .leftJoinAndSelect('folder.users', 'user')
        .leftJoin('folder.sub_folders', 'sub_folder')
        .addSelect('COUNT(DISTINCT sub_folder.id)', 'sub_folder_count')
        .where('user.id = :userId', { userId: user.id })
        .andWhere('folder.organization.id = :organizationId', {
          organizationId: saveOrg.id,
        })
        .groupBy('folder.id, user.id')
        .orderBy('folder.createdAt', 'ASC')
        .getRawMany();

      const mail = {
        to: user.email,
        subject: 'Verify Email',
        from:
          String(process.env.VERIFIED_SENDER_EMAIL) || 'waleed@lockroom.com',
        text: 'Verify',
        html: verificationTemplate(
          String(user.first_name).toUpperCase(),
          `${process.env.FE_HOST}/thank-you/verify-email?customer=${access_token}`,
        ),
      };

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
      // console.log("in user login");
      const user = await this.userRepository.findOne({
        relations: [
          'organizations_added_in.groups',
          'organization_created.groups',
        ],
        where: { email },
      });

      const orgs = [];

      if (!user) {
        // console.log(user);
        throw new UnauthorizedException('Invalid Credentials'); // Throw UnauthorizedException
      }
      if (user.sso_login && user.sso_type == 'google')
        throw new UnauthorizedException('Login with Google');
      // if (!user.is_email_verified)
      //   throw new ConflictException({
      //     status: false,
      //     message: "verify your email",
      //   }); // Throw ConflictException
      const passwordMatched = await bcrypt.compare(password, user.password);
      if (!passwordMatched) {
        throw new UnauthorizedException('Invalid Credentials'); // Throw UnauthorizedException
      }
      if (user.role == 'admin') {
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

        return {
          access_token: accessToken,
          is_phone_number_verified: user.phone_number ? true : false,
          id: user.id,
          user,
          organizations,
        };
      }
      if (user.role == 'guest') {
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
        console.log(orgs,'useree')

        const organizations = await this.orgRepository.find({
          relations: ['users', 'creator'],
          where: {
            id: In(orgs),
          },
        });

        return {
          access_token: accessToken,
          is_phone_number_verified: user.phone_number ? true : false,
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

      const findUser = await this.userRepository.findOne({
        relations: ['organizations_added_in', 'organization_created'],
        where: {
          email: user.email,
        },
      });

      if (findUser) {
        // console.log('google sign finduser', findUser);
        const orgs = [];
        orgs.push(findUser?.organization_created?.id);
        findUser.organizations_added_in.map((org) => {
          orgs.push(org.id);
        });
        const organizations = await this.orgRepository.find({
          relations: ['users', 'creator'],
          where: {
            id: In(orgs),
          },
        });
        // console.log(orgs, 'dsa');
        const query = await this.folderRepository
          .createQueryBuilder('folder')
          .leftJoinAndSelect('folder.users', 'user')
          .where('user.id = :userId', { userId: findUser.id })
          .getMany();
        const query1 = await this.folderRepository
          .createQueryBuilder('folder')
          .leftJoinAndSelect('folder.users', 'user')
          .leftJoin('folder.sub_folders', 'sub_folder')
          .addSelect('COUNT(DISTINCT sub_folder.id)', 'sub_folder_count')
          .where('user.id = :userId', { userId: findUser.id })
          .groupBy('folder.id, user.id')
          .orderBy('folder.createdAt', 'ASC')
          .getRawMany();
        const payload = {
          user_id: findUser.id,
          email: findUser.email,
          role: findUser.role,
        };
        const accessToken = this.jwtService.sign(payload, {
          secret: process.env.JWT_SECRET,
          expiresIn: '1d',
        });
        return {
          access_token: accessToken,
          is_phone_number_verified: findUser.phone_number ? true : false,
          folders: query,
          files_count: query.length,
          sub_folder_count: query1,
          id: findUser.id,
          user: findUser,
          organizations,
        };
      }
      // console.log('1')
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
        .where('user.id = :userId', { userId: new_user.id })
        // .andWhere('folder.organization.id = :organizationId', {
        //   organizationId: organization_id,
        // })
        .groupBy('folder.id, user.id')
        .orderBy('folder.createdAt', 'ASC')
        .getRawMany();

      const new_group = this.groupsRepository.create({
        name: 'Admin',
        createdBy: new_user,
      });
      const saved_group = await this.groupsRepository.save(new_group);

      const new_org = this.orgRepository.create({
        name: 'ORG-' + new_user.id.slice(0, 5),
        creator: saved_user,
        groups: [saved_group],
        users: [],
        invites: [],
      });
      const saveOrg = await this.orgRepository.save(new_org);
      // console.log(saveOrg, 'oorg');
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
      });
      // const find_created_user = await this.userRepository.find({
      //   relations:['organization_created'],
      //   where: {
      //     id: new_user.id
      //   }
      // })
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

  async verifyEmail(jwt_token: string) {
    try {
      const resp = await this.jwtService.verify(jwt_token, {
        secret: process.env.JWT_VERIFY_SECRET,
      });
      if (resp) {
        const findUser = await this.userRepository.findOne({
          where: {
            id: resp.user_id,
          },
        });
        if (!findUser) throw new NotFoundException('user not found');
        findUser.is_email_verified = true;
        return await this.userRepository.save(findUser);
      }
    } catch (error) {}
  }

  async getUserByToken(jwt_token: string) {
    // console.log('in user byb token', jwt_token);
    try {
      const resp = await this.jwtService.verify(jwt_token, {
        secret: process.env.JWT_SECRET,
      });
      // console.log(resp, 'reesps');
      if (resp) {
        const find_user = await this.userRepository.findOne({
          relations: ['organizations_added_in', 'organization_created'],
          where: {
            id: resp.user_id,
          },
        });

        if (!find_user) {
          throw new NotFoundException('user not found');
        }
        const orgs = [];
        if(find_user.role=='admin') orgs.push(find_user.organization_created);
        find_user.organizations_added_in.map((org) => {
          orgs.push(org);
        });

        return { findUser:find_user, organizations: orgs };
      }
      throw new UnauthorizedException('jwt token expired');
    } catch (error) {
      console.log(error, 'err');
      throw error;
    }
  }

  findAll() {
    try {
      return this.userRepository.find();
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async findOne(where: any) {
    return await this.userRepository.findOne({
      relations: ['organization_created', 'organizations_added_in', 'groups'],
      where: where,
    });
  }

  async getAllGroups(user_id: string) {
    try {
      const findUser = await this.userRepository.findOne({
        relations: ['groups'],
        where: {
          id: user_id,
        },
      });
      if (!findUser)
        throw new NotFoundException({
          status: 404,
          message: 'user not found',
        });
      if (findUser.role == 'admin') {
        return await this.groupsRepository.find({
          where: { createdBy: { id: user_id } },
        });
      }
      return findUser.groups;
    } catch (error) {
      console.log(error, 'in err lol');
    }
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async clearDB() {
    try {
      const remove = await this.userRepository.clear();
      console.log(remove, 'in rmeoooood');
      return remove;
    } catch (error) {
      console.log(error);
    }
  }

  async removeAllRecords() {
    console.log('here');
    const entityManager = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    }).manager;
    const entityMetadatas = getMetadataArgsStorage().tables.map(
      (table) => table.target,
    );
    console.log('meta', entityMetadatas);
    await entityManager.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const entityMetadata of entityMetadatas) {
      try {
        // Clear the table using the entity manager
        await entityManager.clear(entityMetadata);
        console.log(`Table ${entityMetadata} cleared successfully.`);
      } catch (error) {
        console.error(`Error clearing table ${entityMetadata}:`, error);
      }
    }
    await entityManager.query('SET FOREIGN_KEY_CHECKS = 1');
  }

  async truncateUserTable() {
    const entityManager = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    }).initialize();

    try {
      // Use createNativeQuery to execute a raw SQL query
      await (
        await entityManager
      ).manager.query('TRUNCATE TABLE "user" CASCADE');

      console.log('User table truncated successfully.');
    } catch (error) {
      console.error('Error truncating user table:', error);
    }
  }
}
