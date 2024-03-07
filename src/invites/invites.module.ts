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
import { UploadService } from 'src/uploads/uploads.service';
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
      Permission
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
  ],
  exports: [InvitesService],
})
export class InvitesModule {}
