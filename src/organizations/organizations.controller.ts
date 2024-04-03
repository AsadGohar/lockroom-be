import {
  Controller,
  Post,
  Body,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { PartialOrganizationDto } from './dto/partial-organization.dto';
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @UseGuards(AuthGuard)
  @Post('org-group-users')
  getUserByOrganizationAndGroup(
    @Body(ValidationPipe) dto: PartialOrganizationDto,
  ) {
    return this.organizationsService.getUsersByOrganizationAndGroup(dto);
  }

  @UseGuards(AuthGuard)
  @Post('org-users')
  getUserByOrganization(@Body(ValidationPipe) dto: PartialOrganizationDto) {
    return this.organizationsService.getUsersByOrganization(dto);
  }
}
