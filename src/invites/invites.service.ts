import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Invite } from '../invites/entities/invite.entity';
import { Group } from 'src/groups/entities/group.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Organization } from 'src/organizations/entities/organization.entity';

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
  ) {}

  create(createInviteDto) {
    return 'This action adds a new invite';
  }

  async findAll() {
    await this.inviteRepository.find();
  }

  async findBySenderId(sender_id: string) {
    return this.inviteRepository
      .createQueryBuilder('invite')
      .leftJoinAndSelect('invite.sender', 'sender')
      .where('sender.id = :userId', { userId: sender_id })
      .getMany();
  }

  async addInvitesBySenderId(
    sender_id: string,
    emails: string[],
    group_id: string,
    organization_id:string
  ) {
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
    const findOrg = await this.groupRepository.findOne({
      where: {
        id: organization_id,
      },
    });
    console.log(findUser, 'user');
    const invites = emails.map((email) => {
      return {
        sender: findUser,
        sent_to: email,
        group: findGroup,
        organization:findOrg
      };
    });
    // console.log(invites, 'invites')
    const invitesDB = await this.inviteRepository.save(invites);
    return { user: findUser, invites: invitesDB };
  }

  async getEmailByToken(jwt_token: string) {
    try {
      const resp = await this.jwtService.verify(jwt_token, {
        secret: process.env.JWT_SECRET,
      });
      if (resp) {
        const findUser = await this.inviteRepository.findOne({
          where: {
            id:resp.invite_id
          },
        });
        if (!findUser) throw new NotFoundException('user not found');
        return { email: findUser.sent_to };
      }
    } catch (error) {}
  }

  async addInvitedUser(email:string, password:string, first_name:string, last_name:string, jwt_token:string) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      password = hashedPassword;
      const full_name = `${first_name} ${last_name}`;
      const role = 'guest';
      const new_user = this.userRepository.create({
        email,
        password,
        first_name,
        last_name,
        role,
        full_name
      })
      const resp = await this.jwtService.verify(jwt_token, {
        secret: process.env.JWT_INVITE_SECRET,
      });
      const invite = await this.inviteRepository.findOne({
        where:{
          id:resp.invite_id
        }
      })
      const find_org = await this.orgRepository.findOne({
        where: {
          id:invite.organization.id
        }
      })
      const saved_user = await this.userRepository.save(new_user);
      find_org.users.push(saved_user)
      await this.orgRepository.save(find_org)
      return saved_user
    } catch (error) {
      console.log(error)
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} invite`;
  }

  update(id: number, updateInviteDto) {
    return `This action updates a #${id} invite`;
  }

  remove(id: number) {
    return `This action removes a #${id} invite`;
  }
}
