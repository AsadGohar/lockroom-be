import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Organization } from 'src/organizations/entities/organization.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,
  ) {}

  async create(name: string, user_id: string, organization_id:string) {
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
          id: user_id,
        },
      });
      if (!findUser) throw new NotFoundException('user not found');
      const findOrg = await this.orgRepository.findOne({
        where:{
          id:organization_id
        }
      })
      const new_group = this.groupsRepository.create({
        name,
        createdBy: findUser,
        organization: findOrg
      });
      return await this.groupsRepository.save(new_group);
    } catch (error) {
      console.log(error, 'err');
    }
  }

  async addUserToAGroup(groupId: string, userId: string) {
    try {
      console.log('inside rhggg')
      const findGroup = await this.groupsRepository.findOne({
        relations: ['users'],
        where: {
          id: groupId,
        },
      });

      const find_org = await this.orgRepository.findOne({
        relations:['users'],
        where: {
          groups: {
            id:groupId
          }
        }
      })

      // console.log(findGroup, 'fggggg');
      if (!findGroup) throw new NotFoundException('group not found');
      const findUser = await this.userRepository.findOne({
        relations:['organizations_added_in'],
        where: {
          id: userId,
        },
      });
      console.log('find user in grp', findUser)
      if (!findUser) throw new NotFoundException('user not found');
      const userExistsInGroup = findGroup.users.some(
        (existingUser) => existingUser.id === findUser.id,
      );
      console.log('gere', findGroup.name, find_org.name )
      if (userExistsInGroup) return
        // throw new ConflictException('user already exists group');
      findGroup.users.push(findUser);
      findUser.organizations_added_in.push(find_org)
      await this.userRepository.save(findUser)
      return await this.groupsRepository.save(findGroup);
    } catch (error) {
      console.log(error);
    }
  }

  async removeUserFromGroup(groupId: string, userId: string) {
    const group = await this.groupsRepository.findOne({
      relations: ['users'],
      where: {
        id: groupId,
      },
    });
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });
    const userIndex = group.users.findIndex(
      (existingUser) => existingUser.id === user.id,
    );
    if (userIndex == -1) throw new ConflictException('user not in the group');
    group.users.splice(userIndex, 1);
    return await this.groupsRepository.save(group);
  }

  async findAll() {
    return await this.groupsRepository.find();
  }

  async findAllUsersInGroup(id: string) {
    try {
      return await this.groupsRepository.findOne({
        relations: ['users'],
        where: {
          id,
        },
      });
    } catch (error) {}
  }

  async findOne(id: string) {
    try {
      return await this.groupsRepository.findOne({
        where: {
          id,
        },
        relations: ['users'],
      });
    } catch (error) {}
  }

  async getGroupsByOrganization(organization_id: string, user_id: string) {
    try {
      return await this.groupsRepository.find({
        where: {
          organization: {
            id: organization_id,
          },
        },
      });
    } catch (error) {}
  }

  update(id: number) {
    return `This action updates a #${id} group`;
  }

  remove(id: number) {
    return `This action removes a #${id} group`;
  }
}
