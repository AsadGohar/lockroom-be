import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { AuthGuard } from 'src/guards/auth.guard';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @UseGuards(AuthGuard)
  @Post('org-group-users')
  getUserByOrganizationAndGroup(
    @Body('room_id') room_id: string,
    @Body('group_id') group_id: string,
  ) {
    return this.organizationsService.getUsersByRoomAndGroup(
      room_id,
      group_id,
    );
  }

  @UseGuards(AuthGuard)
  @Post('org-users')
  getUserByOrganization(@Body('organization_id') organization_id: string) {
    return this.organizationsService.getUsersByOrganization(organization_id);
  }
}
