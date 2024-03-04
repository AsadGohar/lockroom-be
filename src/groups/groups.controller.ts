import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { UpdateGroupDto } from './dto/update-group.dto';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(@Body('name') name:string, @Body('user_id') user_id: string, @Body('organization_id')  organization_id:string) {
    return this.groupsService.create(name, user_id, organization_id);
  }

  @Post('remove-user')
  removeUserFromAGroup(@Body('groupId') groupId:string, @Body('userId') userId: string,) {
    return this.groupsService.removeUserFromGroup(groupId, userId);
  }

  @Get()
  findAll() {
    return this.groupsService.findAll();
  }

  @Post('find-users')
  findAllUsersInGroup(@Body('id') id:string,) {
    return this.groupsService.findAllUsersInGroup(id);
  }

  @Post('org-groups')
  findGroupsByOrganizationAndUserId(@Body('organization_id') organization_id:string, @Body('user_id') user_id:string) {
    return this.groupsService.getGroupsByOrganization(organization_id, user_id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGroupDto: UpdateGroupDto) {
    // return this.groupsService.update(+id, updateGroupDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.groupsService.remove(+id);
  }
}
