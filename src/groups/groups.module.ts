import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { Group } from './entities/group.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Organization } from 'src/organizations/entities/organization.entity';
import { FilesService } from 'src/files/files.service';
import { Folder } from 'src/folders/entities/folder.entity';
import { File } from 'src/files/entities/file.entity';
import { FilesPermissionsService } from 'src/files-permissions/file-permissions.service';
import { GroupFilesPermissions } from 'src/group-files-permissions/entities/group-files-permissions.entity';
import { GroupFilesPermissionsService } from 'src/group-files-permissions/group-files-permissions.service';
import { OrganizationsService } from 'src/organizations/organizations.service';
import { FilesPermissions } from 'src/files-permissions/entities/files-permissions.entity';
import { PermissionService } from 'src/permission/permission.service';
import { Invite } from 'src/invites/entities/invite.entity';
import { Permission } from 'src/permission/entities/permission.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Group,
      User,
      Organization,
      Folder,
      File,
      FilesPermissions,
      GroupFilesPermissions,
      Invite,
      Permission,
    ]),
  ],
  controllers: [GroupsController],
  providers: [
    GroupsService,
    FilesService,
    FilesPermissionsService,
    OrganizationsService,
    PermissionService,
    GroupFilesPermissionsService,
  ],
  exports: [GroupsService],
})
export class GroupsModule {}
