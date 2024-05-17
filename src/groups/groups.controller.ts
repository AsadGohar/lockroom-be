import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { PartialGroupDto } from './dto/partial-group.dto';
import { UserRoleEnum } from 'src/types/enums';
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@Body(ValidationPipe) dto: PartialGroupDto, @Request() request) {
    return this.groupsService.create(dto, request.decoded_data.user_id);
  }

  @Post('find-users')
  findAllUsersInGroup(@Body(ValidationPipe) dto: PartialGroupDto) {
    return this.groupsService.findAllUsersInGroup(dto);
  }

  @UseGuards(AuthGuard)
  @Post('org-groups')
  findGroupsByOrganizationAndUserId(
    @Body(ValidationPipe) dto: PartialGroupDto,
    @Request() request,
  ) {
    return this.groupsService.getGroupsByOrganization(
      dto,
      request.decoded_data.user_id,
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
      old_group_id
    );
  }

  @UseGuards(AuthGuard)
  @Post('promote-demote')
  roleUser(
    @Body('new_role') new_role: UserRoleEnum,
    @Body('user_id') user_id: string,
    @Body('old_group_id') old_group_id: string,
  ) {
    return this.groupsService.updateUserRoleAndChangeGroup(
      user_id,
      new_role,
      old_group_id
    );
  }
}
