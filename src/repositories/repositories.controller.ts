import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RepositoriesService } from './repositories.service';
import { UpdateRepositoryDto } from './dto/update-repository.dto';

@Controller('repositories')
export class RepositoriesController {
  constructor(private readonly repositoriesService: RepositoriesService) {}

  @Post('/create')
  create(
    @Body('name') name: string,
    @Body('userId') userId: string,
  ) {
    try {
      return this.repositoriesService.create(name, userId, null);
    } catch (error) {
      console.log(error)
    }
  }

  @Get()
  findAll() {
    return this.repositoriesService.findAll();
  }

  @Get(':id')
  findAllByUserId(@Param('id') id: string) {
    return this.repositoriesService.findAllByUserId(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.repositoriesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRepositoryDto: UpdateRepositoryDto,
  ) {
    // return this.repositoriesService.update(id, updateRepositoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.repositoriesService.remove(id);
  }
}
