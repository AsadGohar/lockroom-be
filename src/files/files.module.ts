import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { User } from '../users/entities/user.entity';
// import { GroupFilesPermissions } from 'src/group-files-permissions/entities/group-files-permissions.entity';
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
import { UploadService } from 'src/uploads/uploads.service';
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
      Invite
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
  ],
})
export class FilesModule {}
