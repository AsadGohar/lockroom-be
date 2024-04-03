import { PartialType } from '@nestjs/mapped-types';
import { OrganizationDto } from './organization.dto';

export class PartialOrganizationDto extends PartialType(OrganizationDto) {}
