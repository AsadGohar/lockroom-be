import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FilesPermissions } from './entities/files-permissions.entity';
import { PermissionService } from 'src/permission/permission.service';

@Injectable()
export class FilesPermissionsService {
  constructor(
    @InjectRepository(FilesPermissions)
    private readonly filePermRepo: Repository<FilesPermissions>,
    private readonly permissionService: PermissionService,
  ) {}

  async createFilePermissions(file: any) {
    try {
      const permissions = await this.permissionService.createNewPermissions();
      const file_permissions = permissions.map((permission) => {
        return {
          file,
          permission,
        };
      });
      const new_files_permissions =
        await this.filePermRepo.save(file_permissions);
      return new_files_permissions;
    } catch (error) {
      console.log(error);
    }
  }

  async findFilePermissiosn(file_id: string) {
    return await this.filePermRepo.find({
      relations: ['permission', 'file', 'file.folder'],
      where: {
        file: {
          id: file_id,
          folder: {
            is_deleted: false,
          },
        },
      },
      order: {
        file: {
          tree_index: 'ASC',
        },
      },
    });
  }
}
