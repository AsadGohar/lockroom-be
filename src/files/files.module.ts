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

@Module({
  imports: [
    TypeOrmModule.forFeature([Folder, User, File, FilesPermissions])
  ],
  controllers: [FilesController],
  providers: [FilesService, FilesPermissionsService, PermissionService],
})
export class FilesModule {}
