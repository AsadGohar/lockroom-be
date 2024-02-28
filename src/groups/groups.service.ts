import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(name: string, userId: string) {
    try {
      const group = await this.groupsRepository.findOne({
        where: {
          name: name,
        },
      });
      if (group)
        throw new ConflictException('group already exists with same name');
      const findUser = await this.userRepository.findOne({
        where: {
          id: userId,
        },
      });
      if (!findUser) throw new NotFoundException('user not found');
      const new_group = this.groupsRepository.create({
        name,
        createdBy: findUser,
      });
      return await this.groupsRepository.save(new_group);
    } catch (error) {
      console.log(error, 'err');
    }
  }

  async addUserToAGroup(groupId: string, userId: string) {
    try {
      const findGroup = await this.groupsRepository.findOne({
        relations: ['users'],
        where: {
          id: groupId,
        },
      });
      console.log(findGroup, 'fggggg');
      if (!findGroup) throw new NotFoundException('group not found');
      const findUser = await this.userRepository.findOne({
        where: {
          id: userId,
        },
      });
      if (!findUser) throw new NotFoundException('user not found');
      const userExistsInGroup = findGroup.users.some(
        (existingUser) => existingUser.id === findUser.id,
      );
      if (userExistsInGroup)
        throw new ConflictException('user already exists group');
      findGroup.users.push(findUser);
      return await this.groupsRepository.save(findGroup);
    } catch (error) {
      console.log(error);
    }
  }

  async removeUserFromGroup(groupId: string, userId: string) {
    const group = await this.groupsRepository.findOne({
      relations:['users'],
      where:{
        id:groupId
      }
    });
    const user = await this.userRepository.findOne({
      where: {
        id:userId
      }
    });
    const userIndex = group.users.findIndex(existingUser => existingUser.id === user.id);
    if (userIndex == -1) throw new ConflictException('user not in the group')
    group.users.splice(userIndex, 1);
    return await this.groupsRepository.save(group);
  }

  async getGroupsCreatedByUser(createdByUserId: string) {
   
  }

  async findAll() {
    return await this.groupsRepository.find()
  }

  async findOne(id: string) {
    try {
      return await this.groupsRepository.findOne({
        where: {
          id
        },
        relations:['users']
      })
    } catch (error) {
      
    }
  }

  update(id: number) {
    return `This action updates a #${id} group`;
  }

  remove(id: number) {
    return `This action removes a #${id} group`;
  }
}
