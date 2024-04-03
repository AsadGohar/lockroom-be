import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class MailDto {
  @IsArray()
  @IsNotEmpty()
  emails: string[];

  @IsString()
  @IsNotEmpty()
  group_id: string;

  @IsString()
  @IsNotEmpty()
  organization_id: string;
}
