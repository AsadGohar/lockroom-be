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
    @Body('user_id') user_id: string,
    @Body('parent_folder_id') parent_folder_id: string,
    @Body('organization_id')  organization_id:string,
  ) {
    try {
      return this.foldersService.create(name, user_id, organization_id,parent_folder_id)
    } catch (error) {
      console.log(error)
    }
  }

  @Get()
  findAll() {
    return this.foldersService.findAll();
  }

  @Post('/organization')
  findAllByOrganization(@Body('organization_id')  organization_id:string, @Body('user_id')  user_id:string) {
    return this.foldersService.findAllByOrganization(organization_id, user_id);
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
