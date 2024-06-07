import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  Body,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './uploads.service';
import { AuthGuard } from 'src/guards/auth.guard';
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  async uploadFile(
    @UploadedFiles()
    files: Array<Express.Multer.File>,
    @Body('organization_id') organization_id: string,
    @Body('folder_id') folder_id: string,
    @Request() request,
  ) {
    return await this.uploadService.uploadMultiple(
      files,
      folder_id,
      request.decoded_data.user_id,
      organization_id,
    );
  }

  //updating new saved file
  @Patch()
  @UseGuards(AuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  async updateSingle(
    @UploadedFiles()
    file: Express.Multer.File,
    @Body('file_id') file_id: string,
  ) {
    return await this.uploadService.uploadFileAndUpdateUrl(file, file_id);
  }

  //upload file to s3 buckets and update url
  @Post('drag-and-drop')
  @UseGuards(AuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  async dragAndDrop(
    @UploadedFiles()
    files: Array<Express.Multer.File>,
    @Body('file_ids') file_ids: string[],
  ) {
    return await this.uploadService.dragAndDrop(files, file_ids);
  }
}
