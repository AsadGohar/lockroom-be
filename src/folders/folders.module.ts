import { Module } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Folder } from './entities/folder.entity';
import { FoldersController } from './folders.controller';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { GroupFilesPermissions } from 'src/group-files-permissions/entities/group-files-permissions.entity';
import { FilesPermissions } from 'src/files-permissions/entities/files-permissions.entity';
import { File } from 'src/files/entities/file.entity';
import { Organization } from 'src/organizations/entities/organization.entity';
import { Group } from 'src/groups/entities/group.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Folder,
      User,
      GroupFilesPermissions,
      FilesPermissions,
      File,
      Organization,
      Group,
    ]),
    UsersModule,
  ],
  controllers: [FoldersController],
  providers: [FoldersService],
  exports: [FoldersService],
})
export class FoldersModule {}
