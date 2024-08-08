import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Invite } from '../invites/entities/invite.entity';
import { Group } from 'src/groups/entities/group.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Organization } from 'src/organizations/entities/organization.entity';
import { UserRoleEnum } from 'src/types/enums';
import { EmailService } from 'src/email/email.service';
import { signupTemplate } from 'src/utils/email.templates';
import { Room } from 'src/rooms/entities/room.entity';
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
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,

    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
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
    room_id: string,
  ) {
    if (!sender_id || !group_id || !emails)
      throw new NotFoundException('Missing Fields');
    const find_user = await this.userRepository.findOne({
      where: { id: sender_id },
    });
    const find_group = await this.groupRepository.findOne({
      where: { id: group_id },
    });
    const find_room = await this.roomRepository.findOne({
      where: { id: room_id },
    });
    const invites = emails.map((email) => {
      return {
        sender: find_user,
        sent_to: email,
        group: find_group,
        status: 'pending',
        room: find_room,
      };
    });
    const invites_db = await this.inviteRepository.save(invites);
    return { user: find_user, invites: invites_db };
  }

  async getEmailByToken(jwt_token: string) {
    try {
      const resp = await this.jwtService.verify(jwt_token, {
        secret: process.env.JWT_SECRET,
      });
      if (resp) {
        const find_invite = await this.inviteRepository.findOne({
          relations: ['room'],
          where: { id: resp.invite_id },
        });
        if (!find_invite) throw new NotFoundException('user not found');
        console.log();
        return {
          email: find_invite.sent_to,
          organization_id: find_invite.room.id,
        };
      }
    } catch (error) {
      console.log(error);
      throw Error(error);
    }
  }

  async addInvitedUser(
    email: string,
    first_name: string,
    last_name: string,
    phone_number: string,
    jwt_token: string,
  ) {
    try {
      if (!email || !first_name || !last_name || !phone_number || !jwt_token)
        throw new NotFoundException('Missing Fields');
      const find_user = await this.userRepository.findOne({
        relations: ['organizations_added_in'],
        where: { email: email },
      });
      if (find_user) throw new ConflictException('User Already Exists');
      const existing_number = await this.userRepository.findOne({
        where: { phone_number },
      });
      if (existing_number)
        throw new ConflictException('phone number already taken');
      const full_name = `${first_name} ${last_name}`;
      const resp = await this.jwtService.verify(jwt_token, {
        secret: process.env.JWT_SECRET,
      });
      const invite = await this.inviteRepository.findOne({
        relations: ['room', 'group'],
        where: { id: resp.invite_id },
      });

      invite.status = 'accepted';
      await this.inviteRepository.save(invite);
      const find_group = await this.groupRepository.findOne({
        relations: ['users'],
        where: { id: invite.group.id },
      });
      const find_room = await this.roomRepository.findOne({
        where: {
          id: invite.room.id,
        },
      });
      const role =
        find_group?.name?.toLocaleLowerCase() === UserRoleEnum.ADMIN
          ? UserRoleEnum.ADMIN
          : UserRoleEnum.GUEST;

      const new_user = this.userRepository.create({
        email,
        first_name,
        last_name,
        role,
        phone_number,
        full_name,
        groups: [find_group],
        room: find_room,
      });
      await this.groupRepository.save(find_group);
      await this.userRepository.save(new_user);
      await this.inviteRepository.delete({
        sent_to: email,
        room: { id: find_room.id },
      });

      const payload = { user_id: new_user.id, email };
      const access_token = this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '1d',
      });

      await this.sendConfirmPasswordEmail(email, access_token);
      return { status: true };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        error.message || 'failed to create user',
      );
    }
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
}
