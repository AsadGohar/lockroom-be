import { Controller, Post, Body, Request, UseGuards, Delete, Patch, Param, Put } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { UserRoleEnum } from 'src/types/enums';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/guards/role.decorator';
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(
    @Body('name') name: string,
    @Body('room_id') room_id: string,
    @Request() request,
  ) {
    return this.groupsService.create(
      name,
      request.decoded_data?.user_id,
      room_id,
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
  @Post('room-groups')
  findGroupsByOrganizationAndUserId(
    @Body('room_id') room_id: string,
    @Request() request,
  ) {
    return this.groupsService.getGroupsByRoom(
      room_id,
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
  @Roles([UserRoleEnum.ADMIN, UserRoleEnum.OWNER])
  @Put('')
  updateGroupName(
    @Body('group_id') group_id: string,
    @Body('new_group_name') new_group_name: string,
  ) {
    return this.groupsService.updateGroup(
      group_id,
      new_group_name
    );
  }

  @UseGuards(AuthGuard)
  @UseGuards(RolesGuard)
  @Roles([UserRoleEnum.ADMIN, UserRoleEnum.OWNER])
  @Delete(':id')
  deleteGroup(
    @Param('id') id: string
  ) {
    return this.groupsService.deleteGroup(
      id
    );
  }
}
