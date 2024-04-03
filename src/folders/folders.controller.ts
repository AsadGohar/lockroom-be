import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { FoldersService } from './folders.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { PartialFolderDto } from './dto/partial-folder.dto';

@Controller('folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @UseGuards(AuthGuard)
  @Post('/create')
  create(@Body(ValidationPipe) dto: PartialFolderDto, @Request() request) {
    try {
      return this.foldersService.create(dto, request.decoded_data.user_id);
    } catch (error) {
      console.log(error);
    }
  }

  @UseGuards(AuthGuard)
  @Post('/organization')
  findAllByOrganization(
    @Body(ValidationPipe) dto: PartialFolderDto,
    @Request() request,
  ) {
    return this.foldersService.findAllByOrganization(
      dto,
      request.decoded_data.user_id,
    );
  }

  @Post('rename')
  rename(@Body(ValidationPipe) dto: PartialFolderDto) {
    return this.foldersService.rename(dto);
  }

  @Post('delete')
  remove(@Body(ValidationPipe) dto: PartialFolderDto) {
    return this.foldersService.soft_delete(dto);
  }
}
