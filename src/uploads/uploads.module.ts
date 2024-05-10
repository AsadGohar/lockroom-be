import { Module } from '@nestjs/common';
import { UploadController } from './uploads.controller';
import { UploadService } from './uploads.service';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { FilesService } from 'src/files/files.service';
import { Folder } from 'src/folders/entities/folder.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from 'src/files/entities/file.entity';
import { User } from 'src/users/entities/user.entity';
import { FilesPermissionsService } from 'src/files-permissions/file-permissions.service';
import { GroupFilesPermissionsService } from 'src/group-files-permissions/group-files-permissions.service';
import { OrganizationsService } from 'src/organizations/organizations.service';
import { FilesPermissions } from 'src/files-permissions/entities/files-permissions.entity';
import { PermissionService } from 'src/permission/permission.service';
import { GroupFilesPermissions } from 'src/group-files-permissions/entities/group-files-permissions.entity';
import { Group } from 'src/groups/entities/group.entity';
import { Organization } from 'src/organizations/entities/organization.entity';
import { Invite } from 'src/invites/entities/invite.entity';
import { Permission } from 'src/permission/entities/permission.entity';
import { JwtService } from '@nestjs/jwt';
import { FoldersService } from 'src/folders/folders.service';
import { UsersService } from 'src/users/users.service';
import { AuditLogsSerivce } from 'src/audit-logs/audit-logs.service';
import { AuditLogs } from 'src/audit-logs/entities/audit-logs.entities';
import { OTPService } from 'src/otp/otp.service';
import { FileVersion } from 'src/file-version/entities/file-version.entity';
import { UsersModule } from 'src/users/users.module';
import { GroupsService } from 'src/groups/groups.service';
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.getOrThrow('UPLOAD_RATE_TTL'),
            limit: configService.getOrThrow('UPLOAD_RATE_LIMIT'),
          },
        ],
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      Folder,
      File,
      User,
      FilesPermissions,
      GroupFilesPermissions,
      Group,
      Organization,
      Invite,
      Permission,
      AuditLogs,
      FileVersion
    ]),
    // UsersModule
  ],
  controllers: [UploadController],
  providers: [
    UsersService,
    UploadService,
    OTPService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    FilesService,
    FilesPermissionsService,
    GroupFilesPermissionsService,
    OrganizationsService,
    PermissionService,
    JwtService,
    FoldersService,
    AuditLogsSerivce,
  ],
})
export class UploadsModule {}
