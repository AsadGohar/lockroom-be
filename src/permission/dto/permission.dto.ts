import { IsNotEmpty, IsString } from 'class-validator';

export class PermissionDto {
  @IsString()
  @IsNotEmpty()
  organization_id: string;

  @IsString()
  @IsNotEmpty()
  group_id: string;
}
