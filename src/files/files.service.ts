import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Folder } from 'src/folders/entities/folder.entity';
import { Repository } from 'typeorm';
import { File } from './entities/file.entity';
import { FilesPermissionsService } from 'src/files-permissions/file-permissions.service';
import { GroupFilesPermissionsService } from 'src/group-files-permissions/group-files-permissions.service';
import { OrganizationsService } from 'src/organizations/organizations.service';
import { FoldersService } from 'src/folders/folders.service';
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
    private readonly folderService: FoldersService,
    private readonly gfpService: GroupFilesPermissionsService,
    private readonly orgService: OrganizationsService,
  ) {}

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
      if (
        !name ||
        !folder_id ||
        !user_id ||
        !organization_id ||
        !mime_type ||
        !size ||
        !extension ||
        !file_uploaded_name
      )
        throw new NotFoundException('Missing Fields');
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
          folder: {
            id: find_folder.id
          },
          original_name: name,
        },
      });

      const original_name = name; // to be saved without copy indexing
      if (find_file_same_name.length > 0) {
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

      const current_tree_index = `${find_folder.tree_index}.`;
      const next =
        all_child_files.length + all_child_folders.length > 0
          ? `${all_child_files.length + all_child_folders.length + 1}`
          : 1;
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
        original_name,
      });

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
      throw Error(error);
    }
  }

  async getAllFilesByOrganization(organization_id: string) {
    try {
      if (!organization_id) throw new NotFoundException('Missing Fields');
      return this.fileRepository.find({
        relations: ['folder'],
        where: {
          organization: {
            id: organization_id,
          },
        },
      });
    } catch (error) {
      throw Error(error);
    }
  }

  async getFilesWithGroupPermissions(organization_id: string) {
    try {
      if (!organization_id) throw new NotFoundException('Missing Fields');
      const find_files = await this.getAllFilesByOrganization(organization_id);
      const file_ids = find_files.map((file) => file.id);
      await this.gfpService.getGroupFilesPermissiosnByFileIds(file_ids);
    } catch (error) {
      console.log(error);
      throw Error(error);
    }
  }

  async findOne(id: string) {
    try {
      if (!id) throw new NotFoundException('Missing Fields');
      return await this.fileRepository.findOne({
        where: {
          id,
        },
      });
    } catch (error) {
      throw Error(error);
    }
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
    organization_id: string,
    parent_folder_id: string,
  ) {
    const root_folders = await this.foldersRepository.find({
      where: {
        organization: { id: organization_id },
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
          await this.getFoldersAndFilesByOrganizationId(
            organization_id,
            sub.id,
          );
        sub.children.push(...folder_file_structure);
      }
    }
    // return
    return folder_file_structures;
  }

  async getAllFilesByOrg(organization_id: string, parent_folder_id: string) {
    try {
      if (!organization_id) throw new NotFoundException('Missing Fields');
      const result = await this.getFoldersAndFilesByOrganizationId(
        organization_id,
        parent_folder_id,
      );
      const home_folder = JSON.parse(
        JSON.stringify(
          await this.foldersRepository.findOne({
            where: {
              organization: { id: organization_id },
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
      return folder_file_structure;
    } catch (error) {
      throw Error(error);
    }
  }

  async dragAndDropFiles(
    organization_id: string,
    parent_folder_id: string,
    user_id: string,
  ) {
    let files_data = [
      {
        name: 'lockroom-main.zip',
        file_path: '/Documents/new folder',
        mime_type: '',
        size: 0,
      },
      {
        name: 'snooker.jpeg',
        file_path: '/Documents/new folder',
        mime_type: '',
        size: 0,
      },
      {
        name: 'user.js',
        file_path: '/Documents/new folder',
        mime_type: '',
        size: 0,
      },
    ];

    const folderIdToPathMap = new Map();
    const fileIdToPathMap = new Map();

    const parent_folder = await this.foldersRepository.findOne({
      where: {
        id: parent_folder_id,
      },
    });

    files_data.map(async (file) => {
      const path = file.file_path;
      const separated = await this.generatePaths(file.file_path);

      const find_folder = await this.foldersRepository.findOne({
        where: {
          absolute_path: parent_folder.absolute_path + path,
        },
      });
      const file_name_parts = file.name.split('.');
      const file_extension =
        file_name_parts.length > 1 ? file_name_parts.pop() : '';
      if (find_folder) {
        console.log('in find folder');
        folderIdToPathMap.set(find_folder.id, path);
        const add_file_data = await this.addFileToAFolder(
          file.name,
          find_folder.id,
          user_id,
          organization_id,
          file.mime_type,
          file.size,
          file_extension,
          'haha',
        );
        if (add_file_data) {
          console.log('created file', add_file_data.saved_file.name);
          fileIdToPathMap.set(add_file_data.saved_file.id, file.file_path);
        }
      } else {
        // console.log('in not find folder');
        const new_folder_id = await this.createFolderFromPaths(
          separated,
          parent_folder.absolute_path,
          parent_folder.id,
          user_id,
          organization_id,
        );
        console.log(new_folder_id, 'id');
        // folderIdToPathMap.set(new_folder_id, file.file_path);
        // const add_file_data = await this.addFileToAFolder(
        //   file.name,
        //   find_folder?.id,
        //   user_id,
        //   organization_id,
        //   file.mime_type,
        //   file.size,
        //   file_extension,
        //   'haha',
        // );
        // if (add_file_data) {
        //   console.log('created file', add_file_data.saved_file.name);
        //   fileIdToPathMap.set(add_file_data.saved_file.id, file.file_path);
        // }
      }
    });
  }

  async dragAndDropFilesOneLeve(
    organization_id: string,
    parent_folder_id: string,
    folder_name: string,
    user_id: string,
    files: any[],
  ) {
    const file_data = [];
    const find_folder = await this.foldersRepository.findOne({
      where: {
        parent_folder_id,
        name: folder_name,
      },
    });

    if (find_folder) {
      // console.log(find_folder.id,'folder')
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        const file_name_parts = files[index].name.split('.');
        const file_extension =
          file_name_parts.length > 1 ? file_name_parts.pop() : '';
        const create_file = await this.addFileToAFolder(
          file.name,
          find_folder.id,
          user_id,
          organization_id,
          file.mime_type,
          file.size,
          file_extension,
          'hehe',
        );
        // console.log('created file', create_file.saved_file.name);
        file_data.push({
          id: create_file.saved_file.id,
          name: create_file.saved_file.name,
        });
      }
      return file_data;
    } else {
      // console.log('in not find folder');
      const create_folder = await this.folderService.create(
        folder_name,
        user_id,
        organization_id,
        parent_folder_id,
      );
      // console.log('created folder', create_folder.new_folder.name);

      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        const file_name_parts = files[index].name.split('.');
        const file_extension =
          file_name_parts.length > 1 ? file_name_parts.pop() : '';
        const create_file = await this.addFileToAFolder(
          file.name,
          create_folder.new_folder.id,
          user_id,
          organization_id,
          file.mime_type,
          file.size,
          file_extension,
          'hehe',
        );
        // console.log('created file', create_file.saved_file.name);
        file_data.push({
          id: create_file.saved_file.id,
          name: create_file.saved_file.name,
        });
      }
      return file_data;
    }
  }

  private async generatePaths(path: string) {
    const parts = path.split('/').filter((part) => part !== ''); // Split the path and remove empty parts
    const paths = [];

    let currentPath = '';
    for (const part of parts) {
      currentPath += `/${part}`; // Add the current part to the current path
      paths.push({ absolute: currentPath, current: part }); // Add an object with absolute and current folder name
    }

    return paths;
  }

  private async createFolderFromPaths(
    separated,
    parent_absolute_path: string,
    parent_folder_id: string,
    user_id: string,
    organization_id: string,
  ) {
    console.log(separated, 'array');
    // console.log('in create folder from path');
    let created_folder_id = '';
    for (let index = 0; index < separated.length; index++) {
      console.log(
        'check path',
        parent_absolute_path + separated[index].absolute,
        index,
      );
      const find_folder = await this.foldersRepository.findOne({
        where: {
          absolute_path: parent_absolute_path + separated[index].absolute,
        },
      });
      if (!find_folder) {
        console.log('folder not found', separated[index].current);

        const create_folder = await this.folderService.create(
          separated[index].current,
          user_id,
          organization_id,
          parent_folder_id,
        );
        if (create_folder.new_folder) {
          // console.log('folder created');

          console.log('created folder: ' + create_folder.new_folder.name);
          if (index == separated.length) {
            console.log('here 4');

            created_folder_id = create_folder.new_folder.id;
            break;
          }
        }
      } else {
        console.log('here 5');

        parent_folder_id = find_folder.id;
        created_folder_id = find_folder.id;
      }
    }
    return created_folder_id;
  }

  async updateFileNameAndBucketUrlDragAndDrop(file_id:string, file_uploaded_name:string ) {
    try {
      const find_file = await this.fileRepository.findOne({
        where: {
          id:file_id
        }
      })
      find_file.file_uploaded_name = file_uploaded_name
      find_file.bucket_url = 'https://lockroom.s3.amazonaws.com/' + file_uploaded_name
      return await this.fileRepository.save(find_file)
    } catch (error) {
      
    }
  }
}
