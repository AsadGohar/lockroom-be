import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { AuditLogs } from './entities/audit-logs.entities';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsSerivce } from './audit-logs.service';
import { File } from 'src/files/entities/file.entity';
import { Organization } from 'src/organizations/entities/organization.entity';
import { Group } from 'src/groups/entities/group.entity';
import { UploadService } from 'src/uploads/uploads.service';
import { FilesService } from 'src/files/files.service';
import { Folder } from 'src/folders/entities/folder.entity';
import { FilesPermissionsService } from 'src/files-permissions/file-permissions.service';
import { GroupFilesPermissionsService } from 'src/group-files-permissions/group-files-permissions.service';
import { OrganizationsService } from 'src/organizations/organizations.service';
import { FilesPermissions } from 'src/files-permissions/entities/files-permissions.entity';
import { PermissionService } from 'src/permission/permission.service';
import { GroupFilesPermissions } from 'src/group-files-permissions/entities/group-files-permissions.entity';
import { Permission } from 'src/permission/entities/permission.entity';
import { Invite } from 'src/invites/entities/invite.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      AuditLogs,
      File,
      Organization,
      Group,
      Folder,
      FilesPermissions,
      GroupFilesPermissions,
      Permission,
      Invite
    ]),
  ],
  controllers: [AuditLogsController],
  providers: [
    AuditLogsSerivce,
    UploadService,
    FilesService,
    FilesPermissionsService,
    GroupFilesPermissionsService,
    OrganizationsService,
    PermissionService,
  ],
  exports: [AuditLogsSerivce],
})
export class AuditLogsModule {}
