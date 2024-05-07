import { Module } from '@nestjs/common';
import { FileVersionService } from './file-version.service';
import { FileVersionController } from './file-version.controller';

@Module({
  controllers: [FileVersionController],
  providers: [FileVersionService],
})
export class FileVersionModule {}
