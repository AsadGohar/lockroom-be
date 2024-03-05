import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
// import { GroupFilesPermissions } from 'src/group-files-permissions/entities/group-files-permissions.entity';
// import { FilesPermissions } from 'src/files-permissions/entities/files-permissions.entity';
import { Folder } from 'src/folders/entities/folder.entity';
import { Repository } from 'typeorm';
import { File } from './entities/file.entity';
// import { FilesPermissionsService } from 'src/files-permissions/file-permissions.service';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(Folder)
    private readonly foldersRepository: Repository<Folder>,
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    // private readonly fpService: FilesPermissionsService,
  ) {}

  create(createFileDto: CreateFileDto) {
    return 'This action adds a new file';
  }

  async addFileToAFolder(name: string, folder_id: string, user_id: string) {
    try {
      const find_user = await this.userRepository.findOne({
        where: { id: user_id },
      });
      if (!find_user) throw new NotFoundException('user not found');
      const find_folder = await this.foldersRepository.findOne({
        where: { id: folder_id },
      });
      if (!find_folder) throw new NotFoundException('folder not found');

      const all_child_files = await this.fileRepository.find({
        where: {
          folder: {
            id: folder_id,
          },
        },
      });

      const treeIndex = `${find_folder.tree_index}.`;
      const next = all_child_files.length > 0 ? `${all_child_files.length + 1}` : 1;

      const new_file = this.fileRepository.create({
        name,
        folder: find_folder,
        tree_index: treeIndex + next
      });

      const saved_file = await this.fileRepository.save(new_file)

    } catch (error) {
      console.log(error);
    }
  }

  findAll() {
    return `This action returns all files`;
  }

  findOne(id: number) {
    return `This action returns a #${id} file`;
  }

  update(id: number, updateFileDto: UpdateFileDto) {
    return `This action updates a #${id} file`;
  }

  remove(id: number) {
    return `This action removes a #${id} file`;
  }
}
