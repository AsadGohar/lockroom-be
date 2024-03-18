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
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
        GroupFilesPermissions
      ],
      synchronize: true,
      // logging:'all',
      ssl:{
        rejectUnauthorized:false
      },
      // ssl: false,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60, // seconds
          limit: 300,
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
    GroupFilesPermissionsModule
  ],
  controllers: [AppController, MailController, GroupFilesPermissionsController],
  providers: [AppService, EmailService, JwtService],
})
export class AppModule {}
