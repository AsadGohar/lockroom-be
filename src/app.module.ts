import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { UploadsModule } from './uploads/uploads.module';
import { FoldersModule } from './folders/folders.module';
import { Folder } from './folders/entities/folder.entity';
import { MailController } from './mail/mail.controller';
import { EmailService } from './email/email.service';
import { InvitesModule } from './invites/invites.module';
import { Invite } from './invites/entities/invite.entity';
import { PermissionModule } from './permission/permission.module';
import { GroupsModule } from './groups/groups.module';
import { Permission } from './permission/entities/permission.entity';
import { Group } from './groups/entities/group.entity';
import { FilesModule } from './files/files.module';
import { FilesPermissions } from './files-permissions/entities/files-permissions.entity';
import { FilesPermissionsModule } from './files-permissions/files-permissions.module';
import { File } from './files/entities/file.entity';
import { JwtService } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { OrganizationsModule } from './organizations/organizations.module';
import { Organization } from './organizations/entities/organization.entity';
import { GroupFilesPermissions } from './group-files-permissions/entities/group-files-permissions.entity';
import { GroupFilesPermissionsModule } from './group-files-permissions/group-files-permissions.module';
import { GroupFilesPermissionsController } from './group-files-permissions/group-files-permissions.controller';
import { AuditLogs } from './audit-logs/entities/audit-logs.entities';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { FileVersionModule } from './file-version/file-version.module';
import { FileVersion } from './file-version/entities/file-version.entity';
import { RolesGuard } from './guards/role.guard';
import { SubscriptionPlansModule } from './subscription-plans/subscription-plans.module';
import { SubscriptionPlans } from './subscription-plans/entities/subscription-plan.entity';
import { RoomsModule } from './rooms/rooms.module';
import { Room } from './rooms/entities/room.entity';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath: process.env.NODE_ENV == 'development' ? '.env.development' : '.env'
      // envFilePath: `.env.${process.env.NODE_ENV || 'development'},
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [
        User,
        Folder,
        Invite,
        Group,
        Organization,
        File,
        Permission,
        FilesPermissions,
        GroupFilesPermissions,
        AuditLogs,
        FileVersion,
        SubscriptionPlans,
        Room
      ],
      synchronize: true,
      ssl:
        process.env.NODE_ENV == 'development'
          ? false
          : {
              rejectUnauthorized: false,
            },
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 300, // seconds
          limit: 10000,
        },
      ],
    }),
    UsersModule,
    UploadsModule,
    FoldersModule,
    InvitesModule,
    PermissionModule,
    GroupsModule,
    FilesModule,
    FilesPermissionsModule,
    OrganizationsModule,
    GroupFilesPermissionsModule,
    AuditLogsModule,
    FileVersionModule,
    SubscriptionPlansModule,
    RoomsModule,
  ],
  controllers: [AppController, MailController, GroupFilesPermissionsController],
  providers: [AppService, EmailService, JwtService, RolesGuard],
})
export class AppModule {}
