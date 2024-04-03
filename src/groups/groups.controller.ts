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
}
