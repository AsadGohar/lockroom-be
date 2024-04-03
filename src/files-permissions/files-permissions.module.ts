import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesPermissions } from './entities/files-permissions.entity';
import { FilesPermissionsService } from './file-permissions.service';
import { Permission } from 'src/permission/entities/permission.entity';
import { PermissionService } from 'src/permission/permission.service';
@Module({
  imports: [TypeOrmModule.forFeature([FilesPermissions, Permission])],
  providers: [FilesPermissionsService, PermissionService],
  exports: [FilesPermissionsService],
})
export class FilesPermissionsModule {}
