import {
  Controller,
  ParseFilePipe,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './uploads.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(AnyFilesInterceptor())
  async uploadFile(
    @UploadedFiles()
    files: Array<Express.Multer.File>,
    @Body('organization_id') organization_id: string,
    @Body('user_id') user_id: string,
    @Body('folder_id') folder_id: string,
  ) {
    // console.log(files, 'files', organization_id, folder_id, user_id);
   return await this.uploadService.uploadMultiple(files, folder_id, user_id, organization_id);
  }
}
