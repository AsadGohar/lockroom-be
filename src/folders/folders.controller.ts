import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { FoldersService } from './folders.service';
import { UpdateRepositoryDto } from './dto/update-repository.dto';

@Controller('folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Post('/create')
  create(
    @Body('name') name: string,
    @Body('sub') sub: string,
    @Body('parentFolderId') parentFolderId: string,
  ) {
    try {
      return this.foldersService.create(name, sub, parentFolderId)
    } catch (error) {
      console.log(error)
    }
  }

  @Get()
  findAll() {
    return this.foldersService.findAll();
  }

  @Get(':id')
  findAllByUserId(@Param('id') id: string) {
    return this.foldersService.findAllByUserId(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.foldersService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRepositoryDto: UpdateRepositoryDto,
  ) {
    // return this.foldersService.update(id, updateRepositoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.foldersService.remove(id);
  }
}
