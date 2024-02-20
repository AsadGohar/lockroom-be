import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Invite } from '../invites/entities/invite.entity';

@Injectable()
export class InvitesService {
  constructor(
    @InjectRepository(Invite)
    private readonly inviteRepository: Repository<Invite>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
      .leftJoin('invite.sender', 'sender')
      .where('sender.id = :userId', { userId: sender_id })
      .getMany();
  }

  async addInvitesBySenderId(sender_id: string, emails: string[]) {
    const findUser = await this.userRepository.findOne({
      where: {
        id: sender_id,
      },
    });
    console.log(findUser, 'user');
    const invites = emails.map((email) => {
      return {
        sender: findUser,
        sent_to: email,
      };
    });
    const invitesDB = await this.inviteRepository.insert(invites);
    return { user: findUser, invites: invitesDB };
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
