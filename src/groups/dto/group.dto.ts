import { IsNotEmpty, IsString } from 'class-validator';

export class GroupDto {
  @IsString()
  @IsNotEmpty()
  organization_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  id: string;
}
