import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupFilesPermissions } from './entities/group-files-permissions.entity';
import { GroupFilesPermissionsService } from './group-files-permissions.service';
import { GroupsService } from 'src/groups/groups.service';
import { Group } from 'src/groups/entities/group.entity';
import { User } from 'src/users/entities/user.entity';
import { Organization } from 'src/organizations/entities/organization.entity';
import { FilesPermissions } from 'src/files-permissions/entities/files-permissions.entity';
import { FilesService } from 'src/files/files.service';
import { Folder } from 'src/folders/entities/folder.entity';
import { File } from 'src/files/entities/file.entity';
import { FilesPermissionsService } from 'src/files-permissions/file-permissions.service';
import { OrganizationsService } from 'src/organizations/organizations.service';
import { Permission } from 'src/permission/entities/permission.entity';
import { PermissionService } from 'src/permission/permission.service';
import { Invite } from 'src/invites/entities/invite.entity';
import { JwtService } from '@nestjs/jwt';
import { FoldersService } from 'src/folders/folders.service';
import { UsersService } from 'src/users/users.service';
import { AuditLogsSerivce } from 'src/audit-logs/audit-logs.service';
import { AuditLogs } from 'src/audit-logs/entities/audit-logs.entities';
import { EmailService } from 'src/email/email.service';
import { OTPService } from 'src/otp/otp.service';
import { FileVersion } from 'src/file-version/entities/file-version.entity';
import { SubscriptionsService } from 'src/subscription-plans/subscription-plans.service';
import { SubscriptionPlans } from 'src/subscription-plans/entities/subscription-plan.entity';
import { Room } from 'src/rooms/entities/room.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Group,
      User,
      Organization,
      FilesPermissions,
      Folder,
      File,
      Invite,
      GroupFilesPermissions,
      Permission,
      AuditLogs,
      FileVersion,
      SubscriptionPlans,
      Room
    ]),
  ],
  providers: [
    GroupFilesPermissionsService,
    GroupsService,
    FilesService,
    FilesPermissionsService,
    OrganizationsService,
    PermissionService,
    JwtService,
    FoldersService,
    UsersService,
    AuditLogsSerivce,
    EmailService,
    OTPService,
    SubscriptionsService
  ],
  exports: [GroupFilesPermissionsService],
})
export class GroupFilesPermissionsModule {}
