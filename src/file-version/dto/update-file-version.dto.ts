import { PartialType } from '@nestjs/mapped-types';
import { CreateFileVersionDto } from './create-file-version.dto';

export class UpdateFileVersionDto extends PartialType(CreateFileVersionDto) {}
