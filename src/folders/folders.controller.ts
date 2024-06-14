import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Patch,
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

  @UseGuards(AuthGuard)
  @Post('/deleted-items')
  findAllDeletedByOrganization(
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

  @UseGuards(AuthGuard)
  @Post('delete')
  remove(@Body(ValidationPipe) dto: PartialFolderDto) {
    return this.foldersService.softDelete(dto);
  }

  @UseGuards(AuthGuard)
  @Post('restore')
  restore(
    @Body('folder_id') folder_id: string,
    @Body('organization_id') organization_id: string,
  ) {
    return this.foldersService.restore(folder_id, organization_id);
  }

  @UseGuards(AuthGuard)
  @Patch('rearrange')
  rearragne(
    @Body('data') data: any,
    @Body('organization_id') organization_id: string,
    @Request() request,
  ) {
    return this.foldersService.rearrangeFolderAndFiles(
      data,
      organization_id,
      request.decoded_data.user_id,
    );
  }
}
