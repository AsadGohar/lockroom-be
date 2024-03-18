import { Controller, Post, Body } from '@nestjs/common';
import { GroupFilesPermissionsService } from './group-files-permissions.service';
@Controller('gfp')
export class GroupFilesPermissionsController {
  constructor(
    private readonly grpupFilesPermissionsService: GroupFilesPermissionsService,
  ) {}

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
