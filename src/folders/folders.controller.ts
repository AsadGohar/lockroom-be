import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Patch
} from '@nestjs/common';
import { FoldersService } from './folders.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/guards/role.decorator';
import { UserRoleEnum } from 'src/types/enums';

@Controller('folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @UseGuards(AuthGuard)
  @Post('/create')
  create(
    @Body('name') name: string,
    @Body('parent_folder_id') parent_folder_id: string,
    @Body('room_id') room_id: string,
    @Request() request,
  ) {
    try {
      return this.foldersService.create(
        name,
        request.decoded_data.user_id,
        room_id,
        parent_folder_id,
      );
    } catch (error) {
      console.log(error);
    }
  }

  @UseGuards(AuthGuard)
  @Post('/room')
  findAllByOrganization(
    @Body('room_id') room_id: string,
    @Request() request,
  ) {
    return this.foldersService.findAllByRoom(
      room_id,
      request.decoded_data.user_id,
    );
  }

  @UseGuards(AuthGuard)
  @Post('/deleted-items')
  findAllDeletedByOrganization(
    @Body('room_id') room_id: string,
    @Request() request,
  ) {
    return this.foldersService.findAllByRoom(
      room_id,
      request.decoded_data.user_id,
      true,
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
    @Body('room_id') room_id: string,
  ) {
    return this.foldersService.softDelete(folder_id, room_id);
  }

  @UseGuards(AuthGuard)
  @Post('restore')
  restore(
    @Body('folder_id') folder_id: string,
    @Body('room_id') room_id: string,
  ) {
    return this.foldersService.restore(folder_id, room_id);
  }

  @UseGuards(AuthGuard)
  @Patch('rearrange')
  rearragne(
    @Body('data') data: any,
    @Body('room_id') room_id: string,
    @Request() request,
  ) {
    return this.foldersService.rearrangeFolderAndFiles(
      data,
      room_id,
      request.decoded_data.user_id,
    );
  }

  @UseGuards(AuthGuard)
  @UseGuards(RolesGuard)
  @Roles([UserRoleEnum.ADMIN, UserRoleEnum.OWNER])
  @Patch('update-folder-color')
  updateFolderColor(
    @Body('folder_id') folder_id: string,
    @Body('room_id') room_id: string,
    @Body('color') color: string,
    @Request() request,
  ) {
    return this.foldersService.updateFolderColor(room_id,folder_id, color, request.decoded_data.user_id );
  }

  // @UseGuards(AuthGuard)
  // @Post('/structure')
  // getFolderStructure(
  //   @Body('folder_id') folder_id: string,
  //   @Body('room_id') room_id: string,
  //   @Request() request,
  // ) {
  //   return this.foldersService.downloadFolderStructure(folder_id, room_id, request.decoded_data.user_id,);
  // }
}
