import { Controller, Post, Body, Request, UseGuards, Delete } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { UserRoleEnum } from 'src/types/enums';
import { RolesGuard } from 'src/guards/role.guard';
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
      request.decoded_data?.user_id,
      organization_id,
    );
  }

  @UseGuards(AuthGuard)
  @Post('remove-user')
  removeUserFromAGroup(@Body('groupId') groupId: string, @Request() request) {
    return this.groupsService.removeUserFromGroup(
      groupId,
      request.decoded_data?.user_id,
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
      request.decoded_data?.user_id,
    );
  }

  @UseGuards(AuthGuard)
  @Post('switch-user')
  switchUser(
    @Body('new_group_id') new_group_id: string,
    @Body('guest_user_id') guest_user_id: string,
    @Body('old_group_id') old_group_id: string,
  ) {
    return this.groupsService.switchUser(
      guest_user_id,
      new_group_id,
      old_group_id,
    );
  }

  @UseGuards(AuthGuard)
  @Post('promote-demote')
  roleUser(
    @Body('new_role') new_role: UserRoleEnum,
    @Body('user_id') user_id: string,
    @Body('old_group_id') old_group_id: string,
    @Body('org_id') org_id: string,
  ) {
    return this.groupsService.updateUserRoleAndChangeGroup(
      user_id,
      new_role,
      old_group_id,
      org_id,
    );
  }

  @UseGuards(AuthGuard)
  @UseGuards(RolesGuard)
  @Delete('')
  deleteGroup(
    @Body('group_id') group_id: string
  ) {
    return this.groupsService.deleteGroup(
      group_id
    );
  }
}
