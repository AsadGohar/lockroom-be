import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Invite } from '../invites/entities/invite.entity';
import { Group } from 'src/groups/entities/group.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Organization } from 'src/organizations/entities/organization.entity';
import { inviteTemplate } from 'src/utils/email.templates';
import { sendEmailUtil } from 'src/utils/email.utils';
import { GroupsService } from 'src/groups/groups.service';
import { PartialInviteDto } from './dto/partial-invite.dto';
@Injectable()
export class InvitesService {
  constructor(
    @InjectRepository(Invite)
    private readonly inviteRepository: Repository<Invite>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,
    private readonly jwtService: JwtService,
    private readonly groupService: GroupsService,
  ) {}

  async findAll() {
    await this.inviteRepository.find();
  }

  async findBySenderId(sender_id: string) {
    return this.inviteRepository
      .createQueryBuilder('invite')
      .leftJoinAndSelect('invite.sender', 'sender')
      .where('sender.id = :user_id', { user_id: sender_id })
      .getMany();
  }

  async sendInvitesBySenderId(
    sender_id: string,
    emails: string[],
    group_id: string,
    organization_id: string,
  ) {
    // console.log(organization_id, group_id)

    // console.log( sender_id,
    //   emails.length,
    //   group_id,
    //   organization_id,
    //   emails, 'in servoce')
    if (!sender_id || !group_id || !organization_id || !emails)
      throw new NotFoundException('Missing Fields');
    const findUser = await this.userRepository.findOne({
      where: {
        id: sender_id,
      },
    });
    const findGroup = await this.groupRepository.findOne({
      where: {
        id: group_id,
      },
    });
    const findOrg = await this.orgRepository.findOne({
      relations: ['users'],
      where: {
        id: organization_id,
      },
    });
    const invites = emails.map((email) => {
      return {
        sender: findUser,
        sent_to: email,
        group: findGroup,
        organization: findOrg,
        status: 'pending',
      };
    });
    const invitesDB = await this.inviteRepository.save(invites);
    return { user: findUser, invites: invitesDB };
  }

  async getEmailByToken(dto: PartialInviteDto) {
    try {
      const { jwt_token } = dto;
      const resp = await this.jwtService.verify(jwt_token, {
        secret: process.env.JWT_SECRET,
      });
      if (resp) {
        const findInvite = await this.inviteRepository.findOne({
          relations: ['organization'],
          where: {
            id: resp.invite_id,
          },
        });
        if (!findInvite) throw new NotFoundException('user not found');
        console.log();
        return {
          email: findInvite.sent_to,
          organization_id: findInvite.organization.id,
        };
      }
    } catch (error) {
      console.log(error);
      throw Error(error);
    }
  }

  async addInvitedUser(dto: PartialInviteDto) {
    try {
      let { email, password, first_name, last_name, phone_number, jwt_token } =
        dto;
      const find_user = await this.userRepository.findOne({
        relations: ['organizations_added_in'],
        where: {
          email: email,
        },
      });
      if (find_user) {
        throw new ConflictException('User Already Exists');
        // const resp = await this.jwtService.verify(jwt_token, {
        //   secret: process.env.JWT_SECRET,
        // });
        // const invite = await this.inviteRepository.findOne({
        //   relations: ['organization', 'group'],
        //   where: {
        //     id: resp.invite_id,
        //   },
        // });
        // const find_org = await this.orgRepository.findOne({
        //   relations: ['users'],
        //   where: {
        //     id: invite.organization.id,
        //   },
        // });
        // const find_group = await this.groupRepository.findOne({
        //   relations: ['users'],
        //   where: {
        //     id: invite.group.id,
        //   },
        // });
        // find_user.organizations_added_in.push(find_org);
        // find_group.users.push(find_user);
        // const saved_user = await this.userRepository.save(find_user);
        // const find_invite = await this.inviteRepository.findOne({
        //   where: {
        //     id: resp.invite_id,
        //   },
        // });
        // find_invite.status = 'accepted';
        // await this.inviteRepository.save(invite);
        // await this.groupRepository.save(find_group);
        // find_org.users.push(saved_user);
        // await this.orgRepository.save(find_org);
        // return {
        //   status: true,
        // };
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      password = hashedPassword;
      const full_name = `${first_name} ${last_name}`;

      const resp = await this.jwtService.verify(jwt_token, {
        secret: process.env.JWT_SECRET,
      });
      const invite = await this.inviteRepository.findOne({
        relations: ['organization', 'group'],
        where: {
          id: resp.invite_id,
        },
      });
      const find_org = await this.orgRepository.findOne({
        relations: ['users'],
        where: {
          id: invite.organization.id,
        },
      });
      const role = 'guest';

      invite.status = 'accepted';
      await this.inviteRepository.save(invite);
      const find_group = await this.groupRepository.findOne({
        relations: ['users'],
        where: {
          id: invite.group.id,
        },
      });
      const new_user = this.userRepository.create({
        email,
        password,
        first_name,
        last_name,
        role,
        phone_number,
        full_name,
        organizations_added_in: [find_org],
        groups: [find_group],
      });
      await this.groupRepository.save(find_group);
      await this.userRepository.save(new_user);
      return {
        status: true,
      };
      // if(saved_user){
      //   console.log('saved', saved_user)
      //   find_org.users = [...find_org.users, saved_user];
      //   await this.orgRepository.save(find_org);
      //   return saved_user;
      // }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        error.message || 'failed to create user',
      );
    }
  }
}
