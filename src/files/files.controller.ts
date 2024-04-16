import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { group } from 'console';
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @UseGuards(AuthGuard)
  @Post('organization/all')
  findAll(
    @Body('organization_id') organization_id: string,
    @Body('parent_folder_id') parent_folder_id: string,
    @Body('group_id') group_id: string,
  ) {
    return this.filesService.getAllFilesByOrg(
      organization_id,
      parent_folder_id,
      group_id
    );
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.filesService.findOne(id);
  }

  @UseGuards(AuthGuard)
  @Post('drag-and-drop')
  addDragAndDrop(
    @Body('organization_id') organization_id: string,
    @Body('parent_folder_id') parent_folder_id: string,
    @Body('folder_name') folder_name: string,
    @Body('files') files: [],
    @Request() request,
  ) {
    return this.filesService.dragAndDropFilesOneLevel(
      organization_id,
      parent_folder_id,
      folder_name,
      request.decoded_data.user_id,
      files,
    );
  }
  
  @UseGuards(AuthGuard)
  @Post('nested-drag-and-drop')
  addDragAndDropTwo(
    @Body('organization_id') organization_id: string,
    @Body('parent_folder_id') parent_folder_id: string,
    @Body('files') files: [],
    @Request() request,
  ) {
    return this.filesService.dragAndDropFiles(
      organization_id,
      parent_folder_id,
      request.decoded_data.user_id,
      files,
    );
  }
}
