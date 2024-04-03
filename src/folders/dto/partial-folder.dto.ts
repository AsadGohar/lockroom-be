import { PartialType } from '@nestjs/mapped-types';
import { FolderDto } from './folders.dto';

export class PartialFolderDto extends PartialType(FolderDto) {}
