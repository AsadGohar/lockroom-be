import { Injectable } from '@nestjs/common';
import { CreateFileVersionDto } from './dto/create-file-version.dto';
import { UpdateFileVersionDto } from './dto/update-file-version.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileVersion } from './entities/file-version.entity';
@Injectable()
export class FileVersionService {

  constructor(
    @InjectRepository(FileVersion)
    private readonly fileVersionRepository: Repository<FileVersion>,
  ) {}

  create(createFileVersionDto: CreateFileVersionDto) {
    return 'This action adds a new fileVersion';
  }

  findAll() {
    return `This action returns all fileVersion`;
  }

  async findOne(id: number) {
    return await this.fileVersionRepository.findOne({
      relations:['file'],
      where: {
        id
      }
    })
  }

  update(id: number, updateFileVersionDto: UpdateFileVersionDto) {
    return `This action updates a #${id} fileVersion`;
  }

  remove(id: number) {
    return `This action removes a #${id} fileVersion`;
  }
}
