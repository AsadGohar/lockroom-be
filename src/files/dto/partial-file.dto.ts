import { PartialType } from '@nestjs/mapped-types';
import { FileDto } from './file.dto';

export class PartialFileDto extends PartialType(FileDto) {}
