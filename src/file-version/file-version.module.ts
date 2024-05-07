import { Module } from '@nestjs/common';
import { FileVersionService } from './file-version.service';
import { FileVersionController } from './file-version.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileVersion } from './entities/file-version.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      FileVersion
    ]),
  ],
  controllers: [FileVersionController],
  providers: [FileVersionService],
})
export class FileVersionModule {}
