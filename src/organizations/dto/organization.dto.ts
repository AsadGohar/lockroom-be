import { IsNotEmpty, IsString } from 'class-validator';

export class OrganizationDto {
  @IsString()
  @IsNotEmpty()
  organization_id: string;

  @IsString()
  @IsNotEmpty()
  group_id: string;
}
