import { PartialType } from '@nestjs/mapped-types';
import { PermissionDto } from './permission.dto';

export class PartialPermissionDto extends PartialType(PermissionDto) {}
