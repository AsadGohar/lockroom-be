import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupFilesPermissions } from './entities/group-files-permissions.entity';
import { GroupsService } from 'src/groups/groups.service';
import { Group } from 'src/groups/entities/group.entity';
import { In } from 'typeorm';

@Injectable()
export class GroupFilesPermissionsService {
  constructor(
    @InjectRepository(GroupFilesPermissions)
    private readonly groupFilePermRepo: Repository<GroupFilesPermissions>,
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
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
    status: boolean
  ) {
    try {
      const find_group_files_permissions = await this.groupFilePermRepo.findOne(
        {
          relations: ['group', 'file_permission'],
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
      find_group_files_permissions.file_permission.permission.status = status
      await this.groupFilePermRepo.save(find_group_files_permissions)
    } catch (error) {
      console.log(error)
    }
  }

  async getGroupFilesPermissiosnByFileIds(file_ids:string[]) {
    try {
      return await this.groupFilePermRepo.find({
        where: {
          file_permission : {
            file : {
              id:  In(file_ids)
            }
          }
        }
      })
    } catch (error) {
      console.log(error)
    }
  }
}
