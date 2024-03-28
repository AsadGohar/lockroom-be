import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { User } from '../users/entities/user.entity';
import { FilesPermissions } from 'src/files-permissions/entities/files-permissions.entity';
import { Folder } from 'src/folders/entities/folder.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from './entities/file.entity';
import { FilesPermissionsService } from 'src/files-permissions/file-permissions.service';
import { PermissionService } from 'src/permission/permission.service';
import { Permission } from 'src/permission/entities/permission.entity';
import { GroupFilesPermissionsService } from 'src/group-files-permissions/group-files-permissions.service';
import { GroupFilesPermissions } from 'src/group-files-permissions/entities/group-files-permissions.entity';
import { GroupsService } from 'src/groups/groups.service';
import { Group } from 'src/groups/entities/group.entity';
import { Organization } from 'src/organizations/entities/organization.entity';
import { OrganizationsService } from 'src/organizations/organizations.service';
import { Invite } from 'src/invites/entities/invite.entity';
import { JwtService } from '@nestjs/jwt';
import { FoldersService } from 'src/folders/folders.service';
import { UsersService } from 'src/users/users.service';
import { AuditLogsSerivce } from 'src/audit-logs/audit-logs.service';
import { AuditLogs } from 'src/audit-logs/entities/audit-logs.entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Folder,
      User,
      File,
      FilesPermissions,
      Permission,
      GroupFilesPermissions,
      Group,
      Organization,
      Invite,
      AuditLogs
    ]),
  ],
  controllers: [FilesController],
  providers: [
    FilesService,
    FilesPermissionsService,
    PermissionService,
    GroupFilesPermissionsService,
    GroupsService,
    OrganizationsService,
    JwtService,
    FoldersService,
    UsersService,
    AuditLogsSerivce
  ],
})
export class FilesModule {}
