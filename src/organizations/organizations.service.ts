import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { Invite } from 'src/invites/entities/invite.entity';
import { Room } from 'src/rooms/entities/room.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,
    @InjectRepository(Invite)
    private readonly inviteRepository: Repository<Invite>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  async findOne(id: string) {
    return await this.orgRepository.findOne({
      relations: ['groups'],
      where: {
        id,
      },
    });
  }

  async getUsersByOrganization(room_id: string) {
    try {
      const find_org = await this.orgRepository.findOne({
        relations: [
          'creator',
          'users.groups',
          'groups.users',
          'users.created_groups',
        ],
        where: [
          {
            id: room_id,
          },
        ],
      });
      const find_invites = await this.inviteRepository.find({
        relations: ['sender'],
        where: {
          room: {
            id: room_id,
          },
          status: 'pending',
        },
      });
      if (!find_org) throw new NotFoundException('organization not found');
      return {
        organization: find_org,
        invites: find_invites.filter((item) => item.status == 'pending'),
      };
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async getUsersByRoomAndGroup(
    room_id: string,
    group_id: string,
  ) {
    try {
      const find_room = await this.roomRepository.findOne({
        relations: ['groups.users'],
        where: {
          id: room_id,
          groups: {
            id: group_id,
          },
        },
      });
      if (!find_room) throw new NotFoundException('room not found');
      const find_invites = await this.inviteRepository.find({
        relations: ['sender'],
        where: {
          room: {
            id: room_id,
          },
          group: {
            id: group_id,
          },
          status: 'pending',
        },
      });

      return {
        room: { ...find_room, group_name: find_room.groups[0].name },
        invites: find_invites,
      };
    } catch (error) {
      console.log(error);
      return error;
    }
  }
}
