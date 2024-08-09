import { Injectable } from '@nestjs/common';
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
          id:user_id
        }
      },
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} room`;
  }

  update(id: number, updateRoomDto: UpdateRoomDto) {
    return `This action updates a #${id} room`;
  }

  remove(id: number) {
    return `This action removes a #${id} room`;
  }
}
