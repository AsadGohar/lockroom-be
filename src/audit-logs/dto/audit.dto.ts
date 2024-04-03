import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

class DateObjectDto {
  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNotEmpty()
  @IsString()
  value: number;
}

export class AuditDto {
  @IsString()
  @IsNotEmpty()
  organization_id: string;

  @IsString()
  file_id: string;

  @IsString()
  @IsNotEmpty()
  date: DateObjectDto;

  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsEnum(['view', 'login'], {
    message: 'valid type required',
  })
  type: 'view' | 'login';
}
