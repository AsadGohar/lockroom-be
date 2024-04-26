import { Injectable } from '@nestjs/common';
import { Permission } from './entities/permission.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
          type: 'view',
          status: true,
        },
        {
          type: 'download',
          status: true,
        },
      ];
      return await this.permissionRepo.save(new_permissions);
    } catch (error) {
      console.log(error);
    }
  }
}
