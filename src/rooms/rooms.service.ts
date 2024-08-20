import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  async createOnboardingRoom(createRoomDto: CreateRoomDto) {
    const { name, organization, groups, invites } = createRoomDto;
    const new_room = await this.roomRepository.save(
      this.roomRepository.create({
        name,
        organization,
        groups,
        invites,
      }),
    );
    return new_room;
  }

  async create(createRoomDto: CreateRoomDto) {
    const { name, organization, groups, invites } = createRoomDto;
    const new_room = await this.roomRepository.save(
      this.roomRepository.create({
        name,
        organization,
        groups,
        invites,
      }),
    );
    return new_room;
  }

  async findAll(organization_id: string, user_id: string) {
    return await this.roomRepository.find({
      where: {
        organization: {
          id: organization_id,
        },
        users: {
          id: user_id,
        },
      },
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} room`;
  }

  async updateName(room_id: string, new_name: string) {
    const update_room_name = await this.roomRepository.update(
      {
        id: room_id,
      },
      {
        name: new_name,
      },
    );

    if (update_room_name.affected > 0) {
      const room = await this.roomRepository.findOne({
        where: {
          id: room_id,
        },
      });
      return { room: room, message: 'room name updated' };
    }
  }

  async remove(id: string) {
    const find_room = await this.roomRepository.findOne({
      relations: ['users'],
      where: {
        id,
      },
    });
    find_room.users = [];
    find_room.groups = [];
    find_room.folder = [];
    find_room.files = [];
    const delete_users = await this.roomRepository.save(find_room);
    if (delete_users) {
      const delete_room = await this.roomRepository.delete({
        id,
      });
      if (delete_room && delete_room.affected > 0) {
        return {
          success: true,
        };
      } else {
        throw new NotFoundException('room not found');
      }
    }
  }
}
