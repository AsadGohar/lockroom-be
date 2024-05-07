import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FileVersionService } from './file-version.service';
import { CreateFileVersionDto } from './dto/create-file-version.dto';
import { UpdateFileVersionDto } from './dto/update-file-version.dto';

@Controller('file-version')
export class FileVersionController {
  constructor(private readonly fileVersionService: FileVersionService) {}

  @Post()
  create(@Body() createFileVersionDto: CreateFileVersionDto) {
    return this.fileVersionService.create(createFileVersionDto);
  }

  @Get()
  findAll() {
    return this.fileVersionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fileVersionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFileVersionDto: UpdateFileVersionDto) {
    return this.fileVersionService.update(+id, updateFileVersionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fileVersionService.remove(+id);
  }
}
