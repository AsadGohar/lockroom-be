import { IsNotEmpty, IsString } from 'class-validator';

export class FolderDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  organization_id: string;

  @IsString()
  @IsNotEmpty()
  folder_id: string;

  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  new_name: string;

  @IsString()
  @IsNotEmpty()
  parent_folder_id: string;

  @IsString()
  @IsNotEmpty()
  is_deleted?: boolean
}
