import { Injectable } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { Permission } from './entities/permission.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
  ) {}

  create(createPermissionDto: CreatePermissionDto) {
    return 'This action adds a new permission';
  }

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

  findAll() {
    return `This action returns all permission`;
  }

  findOne(id: number) {
    return `This action returns a #${id} permission`;
  }

  update(id: number, updatePermissionDto: UpdatePermissionDto) {
    return `This action updates a #${id} permission`;
  }

  remove(id: number) {
    return `This action removes a #${id} permission`;
  }
}
