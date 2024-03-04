import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.create(createOrganizationDto);
  }

  @Get()
  findAll() {
    return this.organizationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Post('org-group-users')
  getUserByOrganizationAndGroup(
    @Body('organization_id') organization_id: string,
    @Body('group_id') group_id: string,
  ) {
    return this.organizationsService.getUsersByOrganizationAndGroup(
      organization_id,
      group_id,
    );
  }
  
  @Post('org-users')
  getUserByOrganization(
    @Body('organization_id') organization_id: string,
  ) {
    return this.organizationsService.getUsersByOrganization(
      organization_id
    );
  }


  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrganizationDto: UpdateOrganizationDto) {
    return this.organizationsService.update(+id, updateOrganizationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.organizationsService.remove(+id);
  }
}
