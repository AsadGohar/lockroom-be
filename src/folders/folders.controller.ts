import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { FoldersService } from './folders.service';
import { AuthGuard } from 'src/guards/auth.guard';

@Controller('folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @UseGuards(AuthGuard)
  @Post('/create')
  create(
    @Body('name') name: string,
    @Body('parent_folder_id') parent_folder_id: string,
    @Body('organization_id') organization_id: string,
    @Request() request,
  ) {
    try {
      return this.foldersService.create(
        name,
        request.decoded_data.user_id,
        organization_id,
        parent_folder_id,
      );
    } catch (error) {
      console.log(error);
    }
  }

  @UseGuards(AuthGuard)
  @Post('/organization')
  findAllByOrganization(
    @Body('organization_id') organization_id: string,
    @Request() request,
  ) {
    return this.foldersService.findAllByOrganization(
      organization_id,
      request.decoded_data.user_id,
    );
  }

  @Post('rename')
  rename(
    @Body('folder_id') folder_id: string,
    @Body('new_name') new_name: string,
    @Body('parent_folder_id') parent_folder_id: string,
  ) {
    return this.foldersService.rename(folder_id, new_name, parent_folder_id);
  }

  @UseGuards(AuthGuard)
  @Post('delete')
  remove(
    @Body('folder_id') folder_id: string,
    @Body('organization_id') organization_id: string,
  ) {
    return this.foldersService.softDelete(folder_id, organization_id);
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
