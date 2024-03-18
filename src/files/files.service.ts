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
    mime_type: string,
    size: number,
    extension: string,
    file_uploaded_name: string,
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

      const find_file_same_name = await this.fileRepository.find({
        where: {
          original_name:name,
        },
      });

      const original_name = name // to be saved without copy indexing
      if (find_file_same_name.length > 0) {
        console.log(find_file_same_name.length,'length file same')
        find_file_same_name.length == 1
          ? (name = 'copy-' + name)
          : (name = `copy-${find_file_same_name.length}-${name}`);
      }

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

      console.log(all_child_folders, 'folders');

      const current_tree_index = `${find_folder.tree_index}.`;
      const next =
        all_child_files.length + all_child_folders.length > 0
          ? `${all_child_files.length + all_child_folders.length + 1}`
          : 1;
      // console.log(
      //   current_tree_index + next,
      //   'treeee index',
      //   current_tree_index,
      //   next,
      //   all_child_files.length,
      //   all_child_folders.length,
      // );
      const organization = await this.orgService.findOne(organization_id);

      const new_file = this.fileRepository.create({
        name,
        user: find_user,
        folder: find_folder,
        tree_index: current_tree_index + next,
        organization,
        mime_type,
        bucket_url: 'https://lockroom.s3.amazonaws.com/' + file_uploaded_name,
        size_bytes: size,
        extension,
        file_uploaded_name,
        original_name
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
      relations: ['folder'],
      where: {
        organization: {
          id: organization_id,
        },
      },
    });
  }

  async getFilesWithGroupPermissions(organization_id: string) {
    try {
      const find_files = await this.getAllFilesByOrganization(organization_id);
      const file_ids = find_files.map((file) => file.id);
      const find_group_files_permissions =
        this.gfpService.getGroupFilesPermissiosnByFileIds(file_ids);
      console.log(find_group_files_permissions);
    } catch (error) {
      console.log(error);
    }
  }

  findAll() {
    return `This action returns all files`;
  }

  async findOne(id: string) {
    return await this.fileRepository.findOne({
      where: {
        id,
      },
    });
  }

  update(id: number, updateFileDto: UpdateFileDto) {
    return `This action updates a #${id} file`;
  }

  remove(id: number) {
    return `This action removes a #${id} file`;
  }

  async buildFolderFileStructure(folder: Folder) {
    const folder_files = {
      name: folder.name,
      id: folder.id,
      type: 'folder',
      index: folder.tree_index,
      children: [],
    };
    if (folder.files && folder.files.length > 0) {
      for (const file of folder.files) {
        const file_permissions = await this.fpService.findFilePermissiosn(
          file.id,
        );
        console.log(
          file_permissions[0].permission.status,
          file_permissions[0].permission.type,
        );
        const file_access = {
          type: 'file',
          name: file.name,
          has_view_access:
            file_permissions[0].permission.type == 'view'
              ? file_permissions[0].permission.status
              : file_permissions[1].permission.status,
          has_download_access:
            file_permissions[1].permission.type == 'download'
              ? file_permissions[1].permission.status
              : file_permissions[0].permission.status,
          index: file.tree_index,
          mime_type: file.mime_type,
          file_id: file.id,
          url: file.bucket_url,
          extension: file.extension,
        };
        folder_files.children.push(file_access);
      }
    }
    folder_files.children = folder_files.children.sort(
      (a, b) => Number(a.index) - Number(b.index),
    );
    return folder_files;
  }

  async getFoldersAndFilesByOrganizationId(
    organizationId: string,
    parent_folder_id: string,
  ) {
    const root_folders = await this.foldersRepository.find({
      where: {
        organization: { id: organizationId },
        parent_folder_id: parent_folder_id,
      },
      relations: ['sub_folders', 'files.organization'],
      order: {
        tree_index: 'ASC',
      },
    });

    const folder_file_structures = [];
    if (root_folders.length > 0) {
      for (const root_folder of root_folders) {
        const folder_file_structure =
          await this.buildFolderFileStructure(root_folder);
        folder_file_structures.push(folder_file_structure);
      }
      for (const sub of folder_file_structures) {
        const folder_file_structure =
          await this.getFoldersAndFilesByOrganizationId(organizationId, sub.id);
        sub.children.push(...folder_file_structure);
      }
    }
    // return
    return folder_file_structures;
  }

  async getAllFilesByOrg(organizationId: string, parent_folder_id: string) {
    const result = await this.getFoldersAndFilesByOrganizationId(
      organizationId,
      parent_folder_id,
    );
    const home_folder = JSON.parse(
      JSON.stringify(
        await this.foldersRepository.findOne({
          where: {
            organization: { id: organizationId },
            id: parent_folder_id,
          },
          relations: ['sub_folders', 'files.organization'],
        }),
      ),
    );
    const folder_file_structure =
      await this.buildFolderFileStructure(home_folder);
    folder_file_structure.children = [
      ...folder_file_structure.children,
      ...result,
    ].sort((a, b) => a.index - b.index);
    // console.log(folder_file_structure,'struc', result)
    return folder_file_structure;
  }
}
