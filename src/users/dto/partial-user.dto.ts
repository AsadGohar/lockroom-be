import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './user.dto';

export class PartialUserDto extends PartialType(CreateUserDto) {}
