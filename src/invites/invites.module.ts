import { Module } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { InvitesController } from './invites.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invite } from './entities/invite.entity';
import { User } from 'src/users/entities/user.entity';
import { Group } from 'src/groups/entities/group.entity';
import { JwtService } from '@nestjs/jwt';
import { Organization } from 'src/organizations/entities/organization.entity';
import { GroupsService } from 'src/groups/groups.service';
import { FilesPermissions } from 'src/files-permissions/entities/files-permissions.entity';
import { FilesService } from 'src/files/files.service';
import { GroupFilesPermissions } from 'src/group-files-permissions/entities/group-files-permissions.entity';
import { GroupFilesPermissionsService } from 'src/group-files-permissions/group-files-permissions.service';
import { Folder } from 'src/folders/entities/folder.entity';
import { FilesPermissionsService } from 'src/files-permissions/file-permissions.service';
import { OrganizationsService } from 'src/organizations/organizations.service';
import { PermissionService } from 'src/permission/permission.service';
import { Permission } from 'src/permission/entities/permission.entity';
import { FoldersService } from 'src/folders/folders.service';
import { UsersService } from 'src/users/users.service';
import { AuditLogsSerivce } from 'src/audit-logs/audit-logs.service';
import { AuditLogs } from 'src/audit-logs/entities/audit-logs.entities';
import { EmailService } from 'src/email/email.service';
import { OTPService } from 'src/otp/otp.service';
import { FileVersion } from 'src/file-version/entities/file-version.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invite,
      User,
      Group,
      Organization,
      FilesPermissions,
      Folder,
      File,
      GroupFilesPermissions,
      Permission,
      AuditLogs,
      FileVersion,
    ]),
  ],
  controllers: [InvitesController],
  providers: [
    InvitesService,
    JwtService,
    GroupsService,
    FilesService,
    GroupFilesPermissionsService,
    FilesPermissionsService,
    OrganizationsService,
    PermissionService,
    FoldersService,
    UsersService,
    AuditLogsSerivce,
    EmailService,
    OTPService,
  ],
  exports: [InvitesService],
})
export class InvitesModule {}
