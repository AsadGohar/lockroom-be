import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  create(@Body() createFileDto: CreateFileDto) {
    return this.filesService.create(createFileDto);
  }

  // @Post('add')
  // addNewFileToFolder(
  //   @Body('name') name: string,
  //   @Body('folder_id') folder_id: string,
  //   @Body('user_id') user_id: string,
  //   @Body('organization_id') organization_id: string,
  // ) {
  //   return this.filesService.addFileToAFolder(name, folder_id, user_id, organization_id);
  // }

  @Post('organization/all')
  findAll(@Body('organization_id') organization_id: string,) {
    return this.filesService.getAllFilesByOrganization(organization_id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.filesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFileDto: UpdateFileDto) {
    return this.filesService.update(+id, updateFileDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.filesService.remove(+id);
  }
}
