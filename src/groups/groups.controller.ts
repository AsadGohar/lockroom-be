import { Controller, Post, Body, Request, UseGuards } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { AuthGuard } from 'src/guards/auth.guard';
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(
    @Body('name') name: string,
    @Body('organization_id') organization_id: string,
    @Request() request,
  ) {
    return this.groupsService.create(
      name,
      request.decoded_data.user_id,
      organization_id,
    );
  }

  @UseGuards(AuthGuard)
  @Post('remove-user')
  removeUserFromAGroup(@Body('groupId') groupId: string, @Request() request) {
    return this.groupsService.removeUserFromGroup(
      groupId,
      request.decoded_data.user_id,
    );
  }

  @Post('find-users')
  findAllUsersInGroup(@Body('id') id: string) {
    return this.groupsService.findAllUsersInGroup(id);
  }

  @UseGuards(AuthGuard)
  @Post('org-groups')
  findGroupsByOrganizationAndUserId(
    @Body('organization_id') organization_id: string,
    @Request() request,
  ) {
    return this.groupsService.getGroupsByOrganization(
      organization_id,
      request.decoded_data.user_id,
    );
  }
}
