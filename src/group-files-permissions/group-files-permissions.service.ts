import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupFilesPermissions } from './entities/group-files-permissions.entity';
import { Group } from 'src/groups/entities/group.entity';
import { In } from 'typeorm';
import { Permission } from 'src/permission/entities/permission.entity';
import { FilePermissionEnum } from 'src/types/enums';

@Injectable()
export class GroupFilesPermissionsService {
  constructor(
    @InjectRepository(GroupFilesPermissions)
    private readonly groupFilePermRepo: Repository<GroupFilesPermissions>,
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async createGroupFilePermissionsFoAllGroups(
    room_id: string,
    files_permissions: any[],
  ) {
    try {
      const groups = await this.groupsRepository.find({
        where: {
          room: {
            id: room_id,
          },
        },
      });

      const gfp = [];

      for (let index = 0; index < groups.length; index++) {
        const find_perm = files_permissions.find(
          (p) => p.group_name == groups[index].name,
        );
        gfp.push(
          find_perm.file_permissions.map((fp) => {
            return {
              group: groups[index],
              file_permission: fp,
            };
          }),
        );
      }
      // const group_files_permissions = groups
      //   .map((group) => {
      //     return files_permissions.map((fp) => {
      //       return {
      //         group,
      //         file_permission: fp,
      //       };
      //     });
      //   })
      //   .flat();
      // const group_files_permissions = groups.flatMap((group) => {
      //   return files_permissions.map((fp) => {
      //     return {
      //       group,
      //       file_permission: fp,
      //     };
      //   });
      // });
      // console.log(files_permissions, 'fpmm');
      // console.log(gfp.flat(),'ggggg')
      // const group_files_permissions_test = groups.map((group) => {
      //   return
      // }).flat();

      // console.log(group_files_permissions_test, 'fpp');
      // console.log(group_files_permissions_test.map(gfp=>{
      //   return { group_name: gfp.group?.name,
      //     file: gfp.file_permission.file?.name,
      //     perm: gfp.file_permission.permission?.type
      //   }
      // }), 'testssst');
      const new_group_files_permissions = await this.groupFilePermRepo.save(
        gfp.flat(),
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

      const find_view_original_existing_permissions =
        await this.groupFilePermRepo.find({
          relations: ['group', 'file_permission.permission'],
          where: {
            group: { id: group_id },
            file_permission: {
              file: {
                id: In(file_ids),
              },
              permission: {
                status: true,
                type: FilePermissionEnum.VIEW_ORIGINAL,
              },
            },
          },
        });

      const check_if_conditions_already_set = await this.groupFilePermRepo.find(
        {
          relations: ['group', 'file_permission.permission'],
          where: {
            group: { id: group_id },
            file_permission: {
              file: {
                id: In(file_ids),
              },
              permission: {
                status: status,
                type: type,
              },
            },
          },
        },
      ); //check if the view_original permissions are set to true before updating

      const find_download_watermarked_existing_permissions =
        await this.groupFilePermRepo.find({
          relations: ['group', 'file_permission.permission'],
          where: {
            group: { id: group_id },
            file_permission: {
              file: {
                id: In(file_ids),
              },
              permission: {
                status: true,
                type: FilePermissionEnum.DOWNLOAD_WATERMARKED,
              },
            },
          },
        }); //check if download watermark permissions are set to true before updating

      if (check_if_conditions_already_set?.length == file_ids.length) {
        return new ConflictException(`Already set to ${status}`);
      }

      const find_existing_permissions = await this.groupFilePermRepo.find({
        relations: ['group', 'file_permission.permission'],
        where: {
          group: { id: group_id },
          file_permission: {
            file: {
              id: In(file_ids),
            },
            permission: {
              status: true,
              type: In([
                FilePermissionEnum.VIEW_ORIGINAL,
                FilePermissionEnum.DOWNLOAD_WATERMARKED,
              ]),
            },
          },
        },
      });

      if (
        (type === FilePermissionEnum.DOWNLOAD_WATERMARKED ||
          type === FilePermissionEnum.VIEW_ORIGINAL) &&
        find_existing_permissions?.length == file_ids.length &&
        Boolean(status)
      ) {
        return new ConflictException(
          `${type === FilePermissionEnum.DOWNLOAD_WATERMARKED ? 'Enable view watermark' : 'Disable download watermark'} first`,
        )
      }

      if (
        type === FilePermissionEnum.DOWNLOAD_WATERMARKED &&
        find_download_watermarked_existing_permissions?.length ==
          file_ids.length &&
        Boolean(status)
      ) {
        return new ConflictException('Enable view watermark');
      }

      const permission_ids = [];
      find_group_files_permissions.map((gfp) => {
        permission_ids.push(gfp.file_permission.permission.id);
      });

      // console.log(permission_ids,'iddd')

      const update_permissions = await this.permissionRepository.update(
        {
          id: In(permission_ids),
        },
        {
          status: status,
        },
      );
      if (update_permissions.affected > 0) {
        if (
          status &&
          (type == FilePermissionEnum.VIEW_ORIGINAL ||
            type == FilePermissionEnum.VIEW_WATERMARKED ||
            type == FilePermissionEnum.DOWNLOAD_ORIGINAL ||
            type == FilePermissionEnum.DOWNLOAD_WATERMARKED)
        ) {
          const find_reverse_permission = await this.groupFilePermRepo.find({
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
                  type: In(
                    this.getReversePermission(type as FilePermissionEnum),
                  ),
                },
              },
            },
          });
          const reverse_permission_ids = [];
          find_reverse_permission.map((gfp) => {
            reverse_permission_ids.push(gfp.file_permission.permission.id);
          });
          const update_reverse_permissions =
            await this.permissionRepository.update(
              {
                id: In(reverse_permission_ids),
              },
              {
                status: !status,
              },
            );
          return {
            update_reverse_permissions,
            message: 'Permission updated',
            // message: status ? 'enabled view on file' : 'disabled view on file',
          };
        }
        return {
          update_permissions,
          message: 'Permission updated',
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

  private getReversePermission(permission: FilePermissionEnum) {
    if (permission == FilePermissionEnum.VIEW_ORIGINAL) {
      return [FilePermissionEnum.VIEW_WATERMARKED];
    } else if (permission == FilePermissionEnum.VIEW_WATERMARKED) {
      return [
        FilePermissionEnum.VIEW_ORIGINAL,
        FilePermissionEnum.DOWNLOAD_ORIGINAL,
      ];
    } else if (permission == FilePermissionEnum.DOWNLOAD_ORIGINAL) {
      return [
        FilePermissionEnum.DOWNLOAD_WATERMARKED,
        FilePermissionEnum.VIEW_WATERMARKED,
      ];
    } else if (permission == FilePermissionEnum.DOWNLOAD_WATERMARKED) {
      return [FilePermissionEnum.DOWNLOAD_ORIGINAL];
    }
  }
}
