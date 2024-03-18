import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupFilesPermissions } from './entities/group-files-permissions.entity';
import { GroupsService } from 'src/groups/groups.service';
import { Group } from 'src/groups/entities/group.entity';
import { In } from 'typeorm';
import { Permission } from 'src/permission/entities/permission.entity';

@Injectable()
export class GroupFilesPermissionsService {
  constructor(
    @InjectRepository(GroupFilesPermissions)
    private readonly groupFilePermRepo: Repository<GroupFilesPermissions>,
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    // private readonly groupService: GroupsService,
  ) {}

  async createGroupFilePermissionsFoAllGroups(
    organization_id: string,
    files_permissions: any[],
  ) {
    try {
      const groups = await this.groupsRepository.find({
        where: {
          organization: {
            id: organization_id,
          },
        },
      });
      const group_files_permissions = groups
        .map((group) => {
          return files_permissions.map((fp) => {
            return {
              group,
              file_permission: fp,
            };
          });
        })
        .flat();
      console.log(group_files_permissions);
      const new_group_files_permissions = await this.groupFilePermRepo.save(
        group_files_permissions,
      );
      return new_group_files_permissions;
    } catch (error) {
      console.log(error);
    }
  }

  async createGroupFilePermissionsForOneGroup(
    group: any,
    files_permissions: any[],
  ) {
    try {
      const new_fp = files_permissions.map((fp) => {
        return {
          group,
          file_permission: fp,
        };
      });
      console.log(new_fp);
      const new_group_files_permissions =
        await this.groupFilePermRepo.save(new_fp);
      return new_group_files_permissions;
    } catch (error) {
      console.log(error);
    }
  }

  async updateGroupFilePermissions(
    group_id: string,
    file_permission_id: number,
    status: boolean,
  ) {
    try {
      const find_group_files_permissions = await this.groupFilePermRepo.findOne(
        {
          relations: ['group', 'file_permission.status'],
          where: {
            group: {
              id: group_id,
            },
            file_permission: {
              id: file_permission_id,
            },
          },
        },
      );
      find_group_files_permissions.file_permission.permission.status = status;
      await this.groupFilePermRepo.save(find_group_files_permissions);
    } catch (error) {
      console.log(error);
    }
  }

  async newUpdateGroupFilePermissions(
    group_id: string,
    file_ids: string[],
    status: boolean,
    type: string,
  ) {
    try {
      console.log(group_id, file_ids, status, type);
      const find_group_files_permissions = await this.groupFilePermRepo.find({
        relations: ['group', 'file_permission.permission'],
        where: {
          group: {
            id: group_id,
          },
          file_permission: {
            file: {
              id: In(file_ids),
            },
            permission: {
              type,
            },
          },
        },
      });

      const permission_ids = [];
      console.log(permission_ids, 'ids', find_group_files_permissions);
      find_group_files_permissions.map((gfp) => {
        permission_ids.push(gfp.file_permission.permission.id);
      });
      const update_permissions = await this.permissionRepository.update(
        {
          id: In(permission_ids),
        },
        {
          status: status,
        },
      );
      console.log(update_permissions);
      if (update_permissions.affected > 0) {
        return {
          update_permissions,
          message: status ? 'enabled view on file' : 'disabled view on file',
        };
      }
      return { message: 'failed to update permissions' };
    } catch (error) {
      console.log(error);
    }
  }

  async getGroupFilesPermissiosnByFileIds(file_ids: string[]) {
    try {
      return await this.groupFilePermRepo.find({
        where: {
          file_permission: {
            file: {
              id: In(file_ids),
            },
          },
        },
      });
    } catch (error) {
      console.log(error);
    }
  }
}
