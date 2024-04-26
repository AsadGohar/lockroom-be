import {
  IsNotEmpty,
  IsString,
  IsEmail,
  MinLength,
  IsIn
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  first_name: string;

  @IsNotEmpty()
  @IsString()
  last_name: string;

  @IsNotEmpty()
  @IsString()
  full_name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  password: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['admin', 'guest'])
  role: string;
  
  @IsNotEmpty()
  @IsString()
  phone_number: string;
}
