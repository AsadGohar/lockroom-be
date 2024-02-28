import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtService } from '@nestjs/jwt';
import { Folder } from 'src/folders/entities/folder.entity';
import { Group } from 'src/groups/entities/group.entity';
import * as bcrypt from 'bcrypt';
import { sendEmailUtil } from 'src/utils/email.utils';
import { verificationTemplate } from 'src/utils/email.templates';
import { decodeJwtResponse } from 'src/utils/jwt.utils';
import { Invite } from 'src/invites/entities/invite.entity';
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
    @InjectRepository(Invite)
    private readonly Repository: Repository<Group>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    // console.log('here,in')
    // await sendSMS(createUserDto.phone_number)
    try {
      const existingUser = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        const payload = { user_id: existingUser.id, email: existingUser.email };
        const access_token = this.jwtService.sign(payload);

        const query = await this.folderRepository
          .createQueryBuilder('folder')
          .leftJoinAndSelect('folder.users', 'user')
          .where('user.id = :userId', { userId: existingUser.id })
          .getMany();

        const query1 = await this.folderRepository
          .createQueryBuilder('folder')
          .leftJoinAndSelect('folder.users', 'user')
          .leftJoin('folder.sub_folders', 'sub_folder')
          .addSelect('COUNT(DISTINCT sub_folder.id)', 'sub_folder_count')
          .where('user.id = :userId', { userId: existingUser.id })
          .groupBy('folder.id, user.id')
          .orderBy('folder.createdAt', 'ASC')
          .getRawMany();

        return {
          user: existingUser,
          access_token,
          folders: query,
          files_count: query.length,
          sub_folder_count: query1,
          id: existingUser.id,
        };
      }

      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      createUserDto.password = hashedPassword;
      createUserDto.full_name = `${createUserDto.first_name} ${createUserDto.last_name}`;
      createUserDto.role = 'admin';

      const user = await this.userRepository.save(createUserDto);

      const payload = { user_id: user.id, email: user.email };
      const access_token = this.jwtService.sign(payload);

      const folder = await this.folderRepository.save({
        name: 'Home',
        parentFolderId: null,
        tree_index: '1',
        users: [user],
      });

      const query1 = await this.folderRepository
        .createQueryBuilder('folder')
        .leftJoinAndSelect('folder.users', 'user')
        .leftJoin('folder.sub_folders', 'sub_folder')
        .addSelect('COUNT(DISTINCT sub_folder.id)', 'sub_folder_count')
        .where('user.id = :userId', { userId: user.id })
        .groupBy('folder.id, user.id')
        .orderBy('folder.createdAt', 'ASC')
        .getRawMany();

      const new_group = this.groupsRepository.create({
        name: 'Admins',
        createdBy: user,
      });

      await this.groupsRepository.save(new_group);

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

      await sendEmailUtil(mail);

      return {
        user,
        access_token,
        folders: [folder],
        files_count: 1,
        id: user.id,
        sub_folder_count: query1,
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
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        console.log(user);
        throw new UnauthorizedException('Invalid Credentials'); // Throw UnauthorizedException
      }
      if(user.sso_login && user.sso_type=='google') throw new UnauthorizedException('Login with Google')
      const query = await this.folderRepository
        .createQueryBuilder('folder')
        .leftJoinAndSelect('folder.users', 'user')
        .where('user.id = :userId', { userId: user.id })
        .getMany();
      const query1 = await this.folderRepository
        .createQueryBuilder('folder')
        .leftJoinAndSelect('folder.users', 'user')
        .leftJoin('folder.sub_folders', 'sub_folder')
        .addSelect('COUNT(DISTINCT sub_folder.id)', 'sub_folder_count')
        .where('user.id = :userId', { userId: user.id })
        .groupBy('folder.id, user.id')
        .orderBy('folder.createdAt', 'ASC')
        .getRawMany();
      const payload = {
        user_id: user.id,
        email: user.email,
        role: user.role,
      };
      const accessToken = this.jwtService.sign(payload);

      // if (!user.is_email_verified)
      //   throw new ConflictException({
      //     status: false,
      //     message: "verify your email",
      //   }); // Throw ConflictException
      const passwordMatched = await bcrypt.compare(password, user.password);
      console.log(passwordMatched, 'match');
      if (!passwordMatched) {
        throw new UnauthorizedException('Invalid Credentials'); // Throw UnauthorizedException
      }
      return {
        accessToken,
        is_phone_number_verified: user.phone_number ? true : false,
        folders: query,
        files_count: query.length,
        sub_folder_count: query1,
        id: user.id,
        user: user,
      };
    } catch (error) {
      console.log(error);
      throw error; // Rethrow the error to ensure it propagates
    }
  }

  async loginWithGoogle(jwt_token: string) {
    try {
      const user = decodeJwtResponse(jwt_token);
      if (!user) throw new UnauthorizedException('token invalid');

      const findUser = await this.userRepository.findOne({
        where: {
          email: user.email,
        },
      });

      if (findUser) {
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
        const accessToken = this.jwtService.sign(payload);
        return {
          accessToken,
          is_phone_number_verified: findUser.phone_number ? true : false,
          folders: query,
          files_count: query.length,
          sub_folder_count: query1,
          id: findUser.id,
          user: findUser,
        };
      }

      const new_user = this.userRepository.create({
        email: user.email,
        full_name: `${user.given_name} ${user.family_name}`,
        first_name: user.given_name,
        last_name: user.family_name,
        display_picture_url: user.picture,
        sso_login:true,
        sso_type:'google',
      });
      await this.userRepository.save(new_user);

      const folder = await this.folderRepository.save({
        name: 'Home',
        parentFolderId: null,
        tree_index: '1',
        users: [new_user],
      });

      const query1 = await this.folderRepository
        .createQueryBuilder('folder')
        .leftJoinAndSelect('folder.users', 'user')
        .leftJoin('folder.sub_folders', 'sub_folder')
        .addSelect('COUNT(DISTINCT sub_folder.id)', 'sub_folder_count')
        .where('user.id = :userId', { userId: new_user.id })
        .groupBy('folder.id, user.id')
        .orderBy('folder.createdAt', 'ASC')
        .getRawMany();

      const new_group = this.groupsRepository.create({
        name: 'Admins',
        createdBy: new_user,
      });
      await this.groupsRepository.save(new_group);
      const payload = { user_id: new_user.id, email: new_user.email };
      const access_token = this.jwtService.sign(payload);

      return {
        access_token,
        folders: [folder],
        files_count: 1,
        id: new_user.id,
        sub_folder_count: query1,
        user: new_user,
      };
    } catch (error) {}
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
    // console.log('in user byb token');
    const resp = await this.jwtService.verify(jwt_token, {
      secret: process.env.JWT_SECRET,
    });
    console.log(resp, 'reesps');
    if (resp) {
      const findUser = await this.userRepository.findOne({
        where: {
          id: resp.user_id,
        },
      });
      if (!findUser) {
        throw new NotFoundException('user not found');
      }
      const query1 = await this.folderRepository
        .createQueryBuilder('folder')
        .leftJoinAndSelect('folder.users', 'user')
        .leftJoin('folder.sub_folders', 'sub_folder')
        .addSelect('COUNT(DISTINCT sub_folder.id)', 'sub_folder_count')
        .where('user.id = :userId', { userId: findUser.id })
        .groupBy('folder.id, user.id')
        .orderBy('folder.createdAt', 'ASC')
        .getRawMany();
      return { findUser, sub_folder_count: query1 };
    }
  }

  async addInvitedUser() {}

  findAll() {
    try {
      return this.userRepository.find();
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async findOne(where: any) {
    return await this.userRepository.findOne({
      where: where,
    });
  }

  async getAllGroups(userId: string) {
    try {
      const findUser = await this.userRepository.findOne({
        relations: ['group'],
        where: {
          id: userId,
        },
      });
      if (!findUser)
        throw new NotFoundException({
          status: 404,
          message: 'user not found',
        });
      if (findUser.role == 'admin') {
        return await this.groupsRepository.find({
          where: { createdBy: { id: userId } },
        });
      }
      return findUser.group;
    } catch (error) {
      console.log(error, 'in err');
    }
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
