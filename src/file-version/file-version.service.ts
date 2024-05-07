import { Injectable } from '@nestjs/common';
import { CreateFileVersionDto } from './dto/create-file-version.dto';
import { UpdateFileVersionDto } from './dto/update-file-version.dto';

@Injectable()
export class FileVersionService {
  create(createFileVersionDto: CreateFileVersionDto) {
    return 'This action adds a new fileVersion';
  }

  findAll() {
    return `This action returns all fileVersion`;
  }

  findOne(id: number) {
    return `This action returns a #${id} fileVersion`;
  }

  update(id: number, updateFileVersionDto: UpdateFileVersionDto) {
    return `This action updates a #${id} fileVersion`;
  }

  remove(id: number) {
    return `This action removes a #${id} fileVersion`;
  }
}
