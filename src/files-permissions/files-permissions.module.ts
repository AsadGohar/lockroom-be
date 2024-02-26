import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesPermissions } from './entities/files-permissions.entity';
import { FilesPermissionsService } from './file-permissions.service';
import { FilesPermissionsController } from './files-permissiosn.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([FilesPermissions])
  ],
  controllers: [FilesPermissionsController],
  providers: [FilesPermissionsService],
  exports: [FilesPermissionsService]
})
export class FilesPermissionsModule {}
