import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsIn,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  nickname: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['admin', 'guest'])
  role: string;
}
