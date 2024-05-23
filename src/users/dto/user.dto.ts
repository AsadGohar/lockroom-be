import {
  IsNotEmpty,
  IsString,
  IsEmail,
  MinLength,
  IsIn,
} from 'class-validator';
import { UserRoleEnum } from 'src/types/enums';

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
  @IsIn([UserRoleEnum.ADMIN, UserRoleEnum.GUEST, UserRoleEnum.OWNER])
  role: string;

  @IsNotEmpty()
  @IsString()
  phone_number: string;

  @IsNotEmpty()
  @IsString()
  jwt_token: string;

  @IsNotEmpty()
  @IsString()
  user_id: string;
}
