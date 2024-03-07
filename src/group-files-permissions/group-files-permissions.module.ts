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
import { UploadService } from 'src/uploads/uploads.service';

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
    ]),
  ],
  providers: [
    GroupFilesPermissionsService,
    GroupsService,
    FilesService,
    FilesPermissionsService,
    OrganizationsService,
    PermissionService,
    // JwtService
  ],
  exports: [GroupFilesPermissionsService],
})
export class GroupFilesPermissionsModule {}
