import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { EmailService } from 'src/email/email.service';
import { FilesService } from 'src/files/files.service';
import { GroupFilesPermissionsService } from 'src/group-files-permissions/group-files-permissions.service';
import { FilesPermissionsService } from 'src/files-permissions/file-permissions.service';
import { UserRoleEnum } from 'src/types/enums';
import { Room } from 'src/rooms/entities/room.entity';
@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    
    private readonly fileService: FilesService,
    private readonly gfpService: GroupFilesPermissionsService,
    private readonly filePermissionService: FilesPermissionsService,
    private readonly emailService: EmailService,
  ) {}
  async create(name: string, user_id: string, room_id: string) {
    try {
      // console.log(name, user_id, room_id,)
      if (!name || !user_id || !room_id)
        throw new NotFoundException('Missing Fields');
      const group = await this.groupsRepository.findOne({
        where: { name: name,
        room: {
          id:room_id
        } },
      });
      if (group)
        throw new ConflictException('group already exists with same name');
      const find_user = await this.userRepository.findOne({
        where: { id: user_id },
      });
      if (!find_user) throw new NotFoundException('user not found');
      const find_room = await this.roomRepository.findOne({
        where: { id: room_id },
      });
      const new_group = this.groupsRepository.create({
        name,
        created_by: find_user,
        room: find_room
      });
      const find_files =
        await this.fileService.getAllFilesByRoom(room_id);
      const new_file_permissions = [];
      for (let index = 0; index < find_files.length; index++) {
        const element = find_files[index];
        new_file_permissions.push(
          await this.filePermissionService.createFilePermissions(element),
        );
      }
      const saved_group = await this.groupsRepository.save(new_group);
      await this.gfpService.createGroupFilePermissionsForOneGroup(
        saved_group,
        new_file_permissions.flat(),
      );
      return saved_group;
    } catch (error) {
      console.log(error?.response?.message, 'err');
      throw new ConflictException(
        error?.response?.message || 'Something went wrong!',
      );
    }
  }


  async removeUserFromGroup(group_id: string, user_id: string) {
    const group = await this.groupsRepository.findOne({
      relations: ['users'],
      where: { id: group_id },
    });
    const user = await this.userRepository.findOne({
      where: { id: user_id },
    });
    // console.log(group.users)
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
        where: { id },
      });
    } catch (error) {}
  }
  async findOne(id: string) {
    try {
      return await this.groupsRepository.findOne({
        where: { id },
        relations: ['users'],
      });
    } catch (error) {}
  }
  async getGroupsByRoom(room_id: string, user_id: string) {
    // console.log(room_id,'room')
    try {
      if (!room_id || !user_id)
        throw new NotFoundException('Missing Fields');
      const find_user = await this.userRepository.findOne({
        where: { id: user_id },
      });
      const groups_result = [];
      const find_groups = await this.groupsRepository.find({
        relations: ['users', 'room'],
        where: { room: { id: room_id } },
      });
      find_groups.map((group) => {
        if (
          find_user.role == UserRoleEnum.ADMIN ||
          find_user.role == UserRoleEnum.OWNER
        ) {
          groups_result.push(group);
        } else if (group.users.find((user) => user.id == user_id)) {
          groups_result.push(group);
        }
      });
      return groups_result.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );
    } catch (error) {
      console.log(error, 'in group org');
      throw error;
    }
  }
  // async getGroupsByRoom(room_id: string) {
  //   return this.groupsRepository.find({
  //     relations: ['user.organization'],
  //     where: { room: { id: room_id } },
  //   });
  // }
  async switchUser(
    guest_user_id: string,
    new_group_id: string,
    old_group_id: string,
  ) {
    await this.removeUserFromGroup(old_group_id, guest_user_id);
    const find_new_group = await this.groupsRepository.findOne({
      relations: ['users'],
      where: { id: new_group_id },
    });
    const find_user = await this.userRepository.findOne({
      relations: ['room'],
      where: { id: guest_user_id },
    });
    find_new_group.users.push(find_user);
    return await this.groupsRepository.save(find_new_group);
  }

  async updateUserRoleAndChangeGroup(
    user_id: string,
    user_role: UserRoleEnum,
    old_group_id: string,
    room_id: string,
  ) {
    // console.log(user_id, user_role, old_group_id);
    // return
    const update_user = await this.userRepository.update(
      { id: user_id },
      { role: user_role },
    );

    const find_admin_group = await this.groupsRepository.findOne({
      where: { name: 'Admin', room: { id: room_id } },
    });

    // console.log(find_admin_group.users,'addddmin grrppp')

    if (update_user.affected > 0) {
      if (user_role == UserRoleEnum.ADMIN) {
        // console.log('in admin')
        const add_user_to_admin_group = await this.switchUser(
          user_id,
          find_admin_group.id,
          old_group_id,
        );
        if (add_user_to_admin_group) {
          return { group: add_user_to_admin_group };
        }
      }
      if (user_role == UserRoleEnum.GUEST) {
        // console.log('in guest')
        const remove_user_from_admin_group = await this.switchUser(
          user_id,
          find_admin_group.id,
          old_group_id,
        );
        if (remove_user_from_admin_group) {
          return { group: remove_user_from_admin_group };
        }
      }
    }
  }

  async updateGroup(group_id: string, new_group_name: string) {
    const update_group = await this.groupsRepository.update(
      {
        id: group_id,
      },
      {
        name: new_group_name,
      },
    );
    if (update_group && update_group.affected > 0) {
      return {
        success: true,
      };
    }
  }
  async deleteGroup(group_id: string) {
    const find_group = await this.groupsRepository.findOne({
      relations:['users'],
      where: {
        id: group_id,
      },
    })
    find_group.users = []
    const delete_users = await this.groupsRepository.save(find_group)
    if(delete_users){
      const delete_group = await this.groupsRepository.delete({
        id: group_id,
      });
      if (delete_group && delete_group.affected > 0) {
        return {
          success: true,
        };
      } else {
        throw new NotFoundException('group not found');
      }
    }
  }
}
