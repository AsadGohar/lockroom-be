import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Folder } from 'src/folders/entities/folder.entity';
import { Repository } from 'typeorm';
import { File } from './entities/file.entity';
import { FilesPermissionsService } from 'src/files-permissions/file-permissions.service';
import { GroupFilesPermissionsService } from 'src/group-files-permissions/group-files-permissions.service';
import { OrganizationsService } from 'src/organizations/organizations.service';
@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(Folder)
    private readonly foldersRepository: Repository<Folder>,
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly fpService: FilesPermissionsService,
    private readonly gfpService: GroupFilesPermissionsService,
    private readonly orgService: OrganizationsService,
  ) {}

  create(createFileDto: CreateFileDto) {
    return 'This action adds a new file';
  }

  async addFileToAFolder(
    name: string,
    folder_id: string,
    user_id: string,
    organization_id: string,
    mime_type: string
  ) {
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

      const all_child_folders = await this.foldersRepository.find({
        where: {
          parent_folder_id: folder_id,
        },
      });

      const treeIndex = `${find_folder.tree_index}.`;
      const next =
        all_child_files.length + all_child_folders.length > 0
          ? `${all_child_files.length + all_child_folders.length + 1}`
          : 1;

      const organization = await this.orgService.findOne(organization_id);

      const new_file = this.fileRepository.create({
        name,
        user: find_user,
        folder: find_folder,
        tree_index: treeIndex + next,
        organization,
        mime_type,
        bucket_url: 'https://lockroom.s3.amazonaws.com'+name
      });

      // console.log(new_file)
      const saved_file = await this.fileRepository.save(new_file);

      const file_permissions =
        await this.fpService.createFilePermissions(saved_file);
      const new_group_files_permissions =
        await this.gfpService.createGroupFilePermissionsFoAllGroups(
          organization_id,
          file_permissions,
        );
      return { file_permissions, saved_file, new_group_files_permissions };
    } catch (error) {
      console.log(error);
    }
  }

  async getAllFilesByOrganization(organization_id: string) {
    return this.fileRepository.find({
      relations:['folder'],
      where: {
        organization: {
          id: organization_id,
        },
      },
    });
  }

  async getFilesWithGroupPermissions(organization_id:string) {
    try {
      const find_files = await this.getAllFilesByOrganization(organization_id)
      const file_ids = find_files.map(file => file.id)
      const find_group_files_permissions = this.gfpService.getGroupFilesPermissiosnByFileIds(file_ids)
      console.log(find_group_files_permissions)
      
    } catch (error) {
      console.log(error)
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
