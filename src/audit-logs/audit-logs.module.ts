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
import { JwtService } from '@nestjs/jwt';
import { FoldersService } from 'src/folders/folders.service';
import { UsersService } from 'src/users/users.service';
import { OTPService } from 'src/otp/otp.service';
import { FileVersion } from 'src/file-version/entities/file-version.entity';
import { SubscriptionsService } from 'src/subscription-plans/subscription-plans.service';
import { SubscriptionPlans } from 'src/subscription-plans/entities/subscription-plan.entity';
import { EmailService } from 'src/email/email.service';
import { Room } from 'src/rooms/entities/room.entity';

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
      Invite,
      AuditLogs,
      FileVersion,
      SubscriptionPlans,
      Room
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
    JwtService,
    FoldersService,
    UsersService,
    AuditLogsSerivce,
    OTPService,
    SubscriptionsService,
    EmailService
  ],
  exports: [AuditLogsSerivce],
})

export class AuditLogsModule {}
