import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { GroupFilesPermissionsService } from './group-files-permissions.service';
import { AuthGuard } from 'src/guards/auth.guard';
@Controller('gfp')
export class GroupFilesPermissionsController {
  constructor(
    private readonly grpupFilesPermissionsService: GroupFilesPermissionsService,
  ) {}

  @UseGuards(AuthGuard)
  @Post('/update-permissions')
  create(
    @Body('file_ids') file_ids: string[],
    @Body('group_id') group_id: string,
    @Body('new_status') new_status: boolean,
    @Body('type') type: string,
  ) {
    try {
      return this.grpupFilesPermissionsService.newUpdateGroupFilePermissions(
        group_id,
        file_ids,
        new_status,
        type,
      );
    } catch (error) {
      console.log(error);
    }
  }
}
