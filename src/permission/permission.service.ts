import { Injectable } from '@nestjs/common';
import { Permission } from './entities/permission.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FilePermissionEnum } from 'src/types/enums';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
  ) {}

  async createNewPermissions() {
    try {
      const new_permissions = [
        {
          type: FilePermissionEnum.VIEW_ORIGINAL,
          status: true,
        },
        {
          type: FilePermissionEnum.VIEW_WATERMARKED,
          status: false,
        },
        {
          type: FilePermissionEnum.DOWNLOAD_ORIGINAL,
          status: true,
        },
      ];
      return await this.permissionRepo.save(new_permissions);
    } catch (error) {
      console.log(error);
    }
  }
}
