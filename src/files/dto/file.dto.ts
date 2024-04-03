import { IsNotEmpty, IsString, IsArray } from 'class-validator';
export class FileDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  organization_id: string;

  @IsString()
  @IsNotEmpty()
  parent_folder_id: string;

  @IsString()
  @IsNotEmpty()
  folder_name: string;

  @IsArray()
  @IsNotEmpty()
  files: any[];

  @IsArray()
  @IsNotEmpty()
  id: string;

   @IsString()
  @IsNotEmpty()
  group_id: string;
}
