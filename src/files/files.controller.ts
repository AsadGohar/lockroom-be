import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Patch,
  Delete,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { AuthGuard } from 'src/guards/auth.guard';
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @UseGuards(AuthGuard)
  @Post('room/all')
  async findAll(
    @Body('room_id') room_id: string,
    @Body('parent_folder_id') parent_folder_id: string,
    @Body('group_id') group_id: string,
  ) {
    const result = await this.filesService.getAllFilesByOrg(
      room_id,
      parent_folder_id,
      group_id,
    );

    return result.folder_file_structure;
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Request() request) {
    return this.filesService.findOne(id, request.decoded_data.user_id);
  }

  @UseGuards(AuthGuard)
  @Post('drag-and-drop')
  addDragAndDrop(
    @Body('room_id') room_id: string,
    @Body('parent_folder_id') parent_folder_id: string,
    @Body('folder_name') folder_name: string,
    @Body('files') files: [],
    @Request() request,
  ) {
    return this.filesService.dragAndDropFilesOneLevel(
      room_id,
      parent_folder_id,
      folder_name,
      request.decoded_data.user_id,
      files,
    );
  }

  @UseGuards(AuthGuard)
  @Post('nested-drag-and-drop')
  async addDragAndDropTwo(
    @Body('room_id') room_id: string,
    @Body('parent_folder_id') parent_folder_id: string,
    @Body('files') files: [],
    @Request() request,
  ) {
    return await this.filesService.dragAndDropFiles(
      room_id,
      parent_folder_id,
      request.decoded_data.user_id,
      files,
    );
  }

  @UseGuards(AuthGuard)
  @Post('folder/file-permissions')
  async folderFiles(
    @Body('room_id') room_id: string,
    @Body('parent_folder_id') parent_folder_id: string,
    @Body('group_id') group_id: string,
    @Body('status') status: boolean,
    @Body('type') type: string,
  ) {
    return await this.filesService.getFileIdsFromParentFolderAndUpdatePermissions(
      room_id,
      parent_folder_id,
      group_id,
      type,
      status,
    );
  }

  @UseGuards(AuthGuard)
  @Patch('update/:id')
  update(@Param('id') id: string, @Body('data') data: any) {
    return this.filesService.update(id, data);
  }

  @UseGuards(AuthGuard)
  @Delete('delete/:id')
  delete(@Param('id') id: string) {
    return this.filesService.softDelete(id);
  }

  @UseGuards(AuthGuard)
  @Delete('restore/:id')
  restore(@Param('id') id: string) {
    return this.filesService.restore(id);
  }

  @UseGuards(AuthGuard)
  @Post('structure/user')
  async findStructureByUserId(
    @Body('room_id') room_id: string,
    @Body('parent_folder_id') parent_folder_id: string,
    @Request() request,
  ) {
    const result = await this.filesService.getAllFilesByUserId(
      room_id,
      parent_folder_id,
      request.decoded_data.user_id,
    );

    // return result.folder_file_structure;
  }
}
