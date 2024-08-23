import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Folder } from 'src/folders/entities/folder.entity';
import { Repository, In } from 'typeorm';
import { File } from './entities/file.entity';
import { FilesPermissionsService } from 'src/files-permissions/file-permissions.service';
import { GroupFilesPermissionsService } from 'src/group-files-permissions/group-files-permissions.service';
import { OrganizationsService } from 'src/organizations/organizations.service';
import { FoldersService } from 'src/folders/folders.service';
import { Group } from 'src/groups/entities/group.entity';
import { FilePermissionEnum, UserRoleEnum } from 'src/types/enums';
import { FileVersion } from 'src/file-version/entities/file-version.entity';
import { formatBytes } from 'src/utils/converts.utils';
import { Room } from 'src/rooms/entities/room.entity';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(Folder)
    private readonly foldersRepository: Repository<Folder>,
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(FileVersion)
    private readonly fileVersionRepository: Repository<FileVersion>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,

    private readonly fpService: FilesPermissionsService,
    private readonly folderService: FoldersService,
    private readonly gfpService: GroupFilesPermissionsService,
    private readonly orgService: OrganizationsService,
  ) {}

  async addFileToAFolder(
    name: string,
    folder_id: string,
    user_id: string,
    room_id: string,
    mime_type: string,
    size: number,
    extension: string,
    file_uploaded_name: string,
  ) {
    try {
      console.log(name, folder_id, user_id, room_id, file_uploaded_name);
      if (!name || !folder_id || !user_id || !room_id || !file_uploaded_name)
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
        where: { folder: { id: find_folder.id }, original_name: name },
      });

      const original_name = name; // to be saved without copy indexing
      if (find_file_same_name.length > 0) {
        find_file_same_name.length == 1
          ? (name = 'copy-' + name)
          : (name = `copy-${find_file_same_name.length}-${name}`);
      }

      const all_child_files = await this.fileRepository.find({
        where: { folder: { id: folder_id } },
      });

      const all_child_folders = await this.foldersRepository.find({
        where: { parent_folder_id: folder_id },
      });

      const current_tree_index = `${find_folder.tree_index}.`;
      const next =
        all_child_files.length + all_child_folders.length > 0
          ? `${all_child_files.length + all_child_folders.length + 1}`
          : 1;
      // const organization = await this.orgService.findOne(room_id);
      const room = await this.roomRepository.findOne({
        where: {
          id: room_id,
        },
      });

      const bucket_url = process.env.S3_BUCKET_BASE_URL + file_uploaded_name;

      const new_file = this.fileRepository.create({
        name,
        user: find_user,
        folder: find_folder,
        tree_index: current_tree_index + next,
        display_tree_index: find_folder.display_tree_index + '.' + next,
        room: room,
        current_version_id: 0,
        mime_type: mime_type || '',
        size_bytes: size,
        extension,
        file_uploaded_name,
        original_name,
        absolute_path_ids: '',
      });

      const saved_file = await this.fileRepository.save(new_file);
      if (saved_file) {
        await this.fileRepository.update(saved_file.id, {
          absolute_path_ids: find_folder.absolute_path_ids,
        });
        const updated_file = await this.fileRepository.findOne({
          where: { id: saved_file?.id },
        });
        const new_file_version = this.fileVersionRepository.create({
          bucket_url,
          file: updated_file,
        });

        const save_file_version =
          await this.fileVersionRepository.save(new_file_version);

        updated_file.current_version_id = save_file_version.id;
        const new_saved_file = await this.fileRepository.save(updated_file);

        const find_groups = await this.groupRepository.find({
          where: { room: { id: room_id } },
        });

        const file_permissions = [];

        for (let index = 0; index < find_groups.length; index++) {
          const fp = await this.fpService.createFilePermissions(saved_file);
          file_permissions.push({
            file_permissions: fp,
            group_name: find_groups[index].name,
          });
        }

        const new_group_files_permissions =
          await this.gfpService.createGroupFilePermissionsFoAllGroups(
            room_id,
            file_permissions,
          );
        return {
          file_permissions,
          saved_file: new_saved_file,
          new_group_files_permissions,
        };
      } else {
        throw new BadRequestException(
          'Something went wrong while creating file',
        );
      }
    } catch (error) {
      console.log(error);
      throw Error(error);
    }
  }

  async getAllFilesByRoom(room_id: string) {
    try {
      if (!room_id) throw new NotFoundException('Missing Fields');
      return this.fileRepository.find({
        relations: ['folder'],
        where: { is_deleted: false, room: { id: room_id } },
      });
    } catch (error) {
      throw Error(error);
    }
  }

  async getFilesWithGroupPermissions(room_id: string) {
    try {
      if (!room_id) throw new NotFoundException('Missing Fields');
      const find_files = await this.getAllFilesByRoom(room_id);
      const file_ids = find_files.map((file) => file.id);
      await this.gfpService.getGroupFilesPermissiosnByFileIds(file_ids);
    } catch (error) {
      console.log(error);
      throw Error(error);
    }
  }

  async findOne(id: string, user_id: string) {
    if (!id) throw new NotFoundException('Missing Fields');
    const find_user = await this.userRepository.findOne({
      relations: ['groups', 'room'],
      where: { id: user_id },
    });
    if (find_user.role == UserRoleEnum.GUEST) {
      const file_permissions = await this.fpService.findFilePermissiosn(
        id,
        find_user.groups[0].id,
      );

      const view_access_original =
        file_permissions[FilePermissionEnum.VIEW_ORIGINAL];
      const view_access_watermark =
        file_permissions[FilePermissionEnum.VIEW_WATERMARKED];
      const download_access_original =
        file_permissions[FilePermissionEnum.DOWNLOAD_ORIGINAL];
      const download_access_watermark =
        file_permissions[FilePermissionEnum.DOWNLOAD_WATERMARKED];

      const file = await this.fileRepository.findOne({
        relations: [
          'FilesPermissions',
          'FilesPermissions.permission',
          'user',
          'room',
          'versions',
        ],
        where: { id },
      });

      const file_with_url = {
        ...file,
        size: formatBytes(file.size_bytes),
        bucket_url: file.versions.find(
          (version) => version.id == file.current_version_id,
        ).bucket_url,
      };

      if (file.room.id)
        throw new UnauthorizedException('Unauthorized to View File');

      if (!view_access_original && !view_access_watermark)
        throw new UnauthorizedException('Unauthorized to View File');

      return {
        ...file_with_url,
        view_access_original,
        view_access_watermark,
        download_access_original,
        download_access_watermark,
      };
    } else {
      const file = await this.fileRepository.findOne({
        relations: ['user', 'versions'],
        where: { id },
      });
      const file_with_url = {
        ...file,
        size: formatBytes(file.size_bytes),
        bucket_url: file.versions.find(
          (version) => version.id == file.current_version_id,
        ).bucket_url,
      };

      file_with_url.versions.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );

      return file_with_url;
    }
  }

  async findOneWithoutUser(id: string) {
    return await this.fileRepository.findOne({
      relations: [
        'FilesPermissions',
        'FilesPermissions.permission',
        'user',
        'organization',
        'versions',
      ],
      where: { id },
    });
  }

  async buildFolderFileStructure(
    folder: Folder,
    group_id: string,
    file_ids: string[],
  ) {
    const folder_files = {
      name: folder.display_name,
      id: folder.id,
      type: 'folder',
      index: folder.tree_index,
      children: [],
    };
    if (folder.files && folder.files.length > 0) {
      for (const file of folder.files.filter((file) => !file.is_deleted)) {

        if(group_id){          
          const file_permissions = await this.fpService.findFilePermissiosn(
            file.id,
            group_id,
          );
  
          const view_access_original =
            file_permissions[FilePermissionEnum.VIEW_ORIGINAL];
          const view_access_watermark =
            file_permissions[FilePermissionEnum.VIEW_WATERMARKED];
          const download_access_original =
            file_permissions[FilePermissionEnum.DOWNLOAD_ORIGINAL];
          const download_access_watermark =
            file_permissions[FilePermissionEnum.DOWNLOAD_WATERMARKED];
  
          const current_file_details = await this.fileVersionRepository.findOne({
            where: {
              id: file.current_version_id,
            },
          });
  
          const file_access = {
            type: 'file',
            name: file.name,
            has_view_access_original: view_access_original,
            has_view_access_watermark: view_access_watermark,
            has_download_access_original: download_access_original,
            has_download_access_watermark: download_access_watermark,
            index: file.tree_index,
            mime_type: file.mime_type,
            file_id: file.id,
            url: current_file_details.bucket_url,
            extension: file.extension,
          };
          folder_files.children.push(file_access);
          file_ids.push(file.id);
        }
        else {
          const file_access = {
            type: 'file',
            name: file.name,
            index: file.tree_index,
            mime_type: file.mime_type,
            file_id: file.id,
            extension: file.extension,
          };
          folder_files.children.push(file_access);
          file_ids.push(file.id);
        }
      }
    }
    folder_files.children = folder_files.children.sort(
      (a, b) => Number(a.index) - Number(b.index),
    );
    return folder_files;
  }

  async getFoldersAndFilesByRoomId(
    room_id: string,
    parent_folder_id: string,
    group_id: string | null,
    file_ids: string[],
  ) {
    // console.log(parent_folder_id,'pareeeent')
    // return
    const root_folders = await this.foldersRepository.find({
      relations: ['sub_folders', 'files.room'],
      where: {
        room: { id: room_id },
        parent_folder_id: parent_folder_id,
        is_deleted: false,
      },
      order: { tree_index: 'ASC' },
    });

    // console.log(root_folders,'root folders')
    // return

    const folder_file_structures = [];
    if (root_folders.length > 0) {
      for (const root_folder of root_folders) {
        const new_root = root_folder.files.filter((file) => !file.is_deleted);
        // console.log(root_folder, new_root, 'dasdas');
        const folder_file_structure = await this.buildFolderFileStructure(
          root_folder,
          group_id,
          file_ids,
        );
        folder_file_structures.push(folder_file_structure);
      }
      for (const sub of folder_file_structures) {
        const folder_file_structure = await this.getFoldersAndFilesByRoomId(
          room_id,
          sub.id,
          group_id,
          file_ids,
        );
        sub.children.push(...folder_file_structure);
      }
    }
    return folder_file_structures;
  }

  async getAllFilesByOrg(
    room_id: string,
    parent_folder_id: string,
    group_id: string,
  ) {
    try {
      // console.log(room_id,'dasdas')
      if (!room_id) throw new NotFoundException('Missing Fields');
      const file_ids_in_org = [];
      const result = await this.getFoldersAndFilesByRoomId(
        room_id,
        parent_folder_id,
        group_id,
        file_ids_in_org,
      );
      const home_folder = JSON.parse(
        JSON.stringify(
          await this.foldersRepository.findOne({
            where: {
              room: { id: room_id },
              id: parent_folder_id,
            },
            relations: ['sub_folders', 'files.room'],
          }),
        ),
      );
      const folder_file_structure = await this.buildFolderFileStructure(
        home_folder,
        group_id,
        file_ids_in_org,
      );
      folder_file_structure.children = [
        ...folder_file_structure.children,
        ...result,
      ].sort((a, b) => a.index - b.index);

      const data = { ...folder_file_structure };
      this.checkPermissions(data);
      return {
        folder_file_structure: JSON.parse(JSON.stringify(data, null, 2)),
        file_ids_in_org,
      };
    } catch (error) {
      throw Error(error);
    }
  }

  async dragAndDropFiles(
    room_id: string,
    parent_folder_id: string,
    user_id: string,
    files_data: any[],
  ) {
    const folderIdToPathMap = new Map();
    const fileIdToPathMap = new Map();

    const data_to_return = [];

    const parent_folder = await this.foldersRepository.findOne({
      where: { id: parent_folder_id },
    });

    for (let index = 0; index < files_data.length; index++) {
      const file = files_data[index];
      const path = files_data[index].file_path;
      const find_folder = await this.foldersRepository.findOne({
        where: { absolute_path: parent_folder.absolute_path + path },
      });
      const file_name_parts = file.name.split('.');
      const file_extension =
        file_name_parts.length > 1 ? file_name_parts.pop() : '';
      if (find_folder) {
        folderIdToPathMap.set(find_folder.id, path);
        const add_file_data = await this.addFileToAFolder(
          file.name,
          find_folder.id,
          user_id,
          room_id,
          file.mime_type,
          file.size,
          file_extension,
          'placeholder',
        );
        if (add_file_data) {
          fileIdToPathMap.set(add_file_data.saved_file.id, file.file_path);
          data_to_return.push({
            id: add_file_data.saved_file.id,
            file_path: path + '/' + add_file_data.saved_file.name,
          });
        }
      } else {
        // console.log('folder not found', 'parent', parent_folder.name, path);

        const new_folder_id = await this.ensureFolderPathExists(
          path,
          parent_folder.id,
          user_id,
          room_id,
        );
        console.log(new_folder_id, 'id');
        folderIdToPathMap.set(new_folder_id, file.file_path);
        const add_file_data = await this.addFileToAFolder(
          file.name,
          new_folder_id,
          user_id,
          room_id,
          file.mime_type,
          file.size,
          file_extension,
          'placeholder',
        );
        if (add_file_data) {
          fileIdToPathMap.set(add_file_data.saved_file.id, file.file_path);
          data_to_return.push({
            id: add_file_data.saved_file.id,
            file_path: path + '/' + add_file_data.saved_file.name,
          });
        }
      }
    }

    return data_to_return;
  }

  async dragAndDropFilesOneLevel(
    room_id: string,
    parent_folder_id: string,
    folder_name: string,
    user_id: string,
    files: any[],
  ) {
    const file_data = [];
    const find_folder = await this.foldersRepository.findOne({
      where: { parent_folder_id, name: folder_name },
    });

    if (find_folder) {
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        const file_name_parts = files[index].name.split('.');
        const file_extension =
          file_name_parts.length > 1 ? file_name_parts.pop() : '';
        const create_file = await this.addFileToAFolder(
          file.name,
          find_folder.id,
          user_id,
          room_id,
          file.mime_type,
          file.size,
          file_extension,
          'placeholder',
        );
        file_data.push({
          id: create_file.saved_file.id,
          name: create_file.saved_file.name,
        });
      }
      return file_data;
    } else {
      const create_folder = await this.folderService.create(
        folder_name,
        user_id,
        room_id,
        parent_folder_id,
      );

      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        const file_name_parts = files[index].name.split('.');
        const file_extension =
          file_name_parts.length > 1 ? file_name_parts.pop() : '';
        const create_file = await this.addFileToAFolder(
          file.name,
          create_folder.new_folder.id,
          user_id,
          room_id,
          file.mime_type,
          file.size,
          file_extension,
          'placeholder',
        );
        file_data.push({
          id: create_file.saved_file.id,
          name: create_file.saved_file.name,
        });
      }
      return file_data;
    }
  }

  private async ensureFolderPathExists(
    filePath: string,
    parent_folder_id: string,
    user_id: string,
    room_id: string,
  ) {
    const folderNames = filePath
      .split('/')
      .filter((folder) => folder.trim() !== '');

    let currentFolderId = parent_folder_id;
    for (const folderName of folderNames) {
      // console.log(folderName, 'name');
      const folder = await this.foldersRepository.findOne({
        where: { name: folderName, parent_folder_id: currentFolderId },
      });
      if (!folder) {
        // console.log('nested not found', folderName);
        const create_folder = await this.folderService.create(
          folderName,
          user_id,
          room_id,
          currentFolderId,
        );
        // console.log(
        //   'CREATED FOLDER',
        //   create_folder.new_folder.name,
        //   create_folder.parent_folder.name,
        // );
        currentFolderId = create_folder.new_folder.id;
      } else {
        currentFolderId = folder.id;
        // console.log('nested found', folderName);
      }
    }
    return currentFolderId;
  }

  async updateFileNameAndBucketUrlDragAndDrop(
    file_id: string,
    file_uploaded_name: string,
  ) {
    const find_file = await this.fileRepository.findOne({
      where: { id: file_id },
    });
    const update_file = await this.fileRepository.update(
      { id: file_id },
      { file_uploaded_name },
    );
    const update_file_version = await this.fileVersionRepository.update(
      { id: find_file.current_version_id },
      { bucket_url: process.env.S3_BUCKET_BASE_URL + file_uploaded_name },
    );
    if (update_file.affected > 0 && update_file_version.affected > 0) {
      const file = await this.fileRepository.findOne({
        where: { id: file_id },
      });
      return file;
    }
  }

  async getFileIdsFromParentFolderAndUpdatePermissions(
    room_id: string,
    parent_folder_id: string,
    group_id: string,
    type: string,
    status: boolean,
  ) {
    // console.log(room_id, parent_folder_id, group_id,type,status)
    // return
    const result = await this.getAllFilesByOrg(
      room_id,
      parent_folder_id,
      group_id,
    );
    // console.log(result, 'result from getAllFilesByoRg');
    // return
    const update_files_permissions =
      await this.gfpService.newUpdateGroupFilePermissions(
        group_id,
        result.file_ids_in_org,
        status,
        type,
      );
    return update_files_permissions;
  }

  async findFileAndUpdateUrl(file_id: string, new_name: string) {
    const find_file = await this.fileRepository.findOne({
      where: { id: file_id },
    });

    const new_file_version = await this.fileVersionRepository.save(
      this.fileVersionRepository.create({
        file: find_file,
        bucket_url: process.env.S3_BUCKET_BASE_URL + new_name,
      }),
    );

    find_file.current_version_id = new_file_version.id;
    await this.fileRepository.save(find_file);
    return { message: 'file url updated', file: find_file };
  }

  async update(id: string, properties: any) {
    if (properties?.current_version_id) {
      const find_file_version = await this.fileVersionRepository.findOne({
        relations: ['file'],
        where: { id: properties?.current_version_id, file: { id } },
      });
      if (!find_file_version)
        throw new NotFoundException('invalid file version');
    }
    const file = await this.fileRepository.update(id, properties);
    if (file.affected > 0) {
      return { file, message: 'file updated successfully' };
    }
    return { message: 'failed to update file' };
  }

  async softDelete(id: string) {
    const soft_delete = await this.fileRepository.update(id, {
      is_deleted: true,
      this_deleted: true,
    });
    if (soft_delete) {
      return { message: 'file deleted successfully' };
    }
    return { message: 'failed to delete file' };
  }

  async restore(id: string) {
    const file = await this.fileRepository.findOne({
      where: { id },
      relations: ['folder'],
    });
    if (file?.folder?.is_deleted) {
      const folders_to_restore = file.absolute_path_ids?.split('/')?.slice(1);
      await this.foldersRepository.update(
        { id: In(folders_to_restore) },
        { is_partial_restored: true },
      );
    }
    const restore = await this.fileRepository.update(id, {
      is_deleted: false,
      this_deleted: false,
    });
    if (restore) {
      return { message: 'file restored successfully' };
    }
    return { message: 'failed to restore file' };
  }

  private checkPermissions(obj) {
    let allHasViewAccessOriginal = true;
    let allHasViewAccessWatermark = true;
    let allHasDownloadAccessOriginal = true;
    let allHasDownloadAccessWatermark = true;

    // If the object has children, process each child
    if (obj.children && obj.children.length > 0) {
      for (let child of obj.children) {
        // Recursively check each child's permissions
        const childPermissions = this.checkPermissions(child);

        // Aggregate the permission values from children
        allHasViewAccessOriginal =
          allHasViewAccessOriginal && childPermissions.allHasViewAccessOriginal;
        allHasViewAccessWatermark =
          allHasViewAccessWatermark &&
          childPermissions.allHasViewAccessWatermark;
        allHasDownloadAccessOriginal =
          allHasDownloadAccessOriginal &&
          childPermissions.allHasDownloadAccessOriginal;
        allHasDownloadAccessWatermark =
          allHasDownloadAccessWatermark &&
          childPermissions.allHasDownloadAccessWatermark;
      }
    } else {
      // If it's a file (leaf node), return its permissions
      allHasViewAccessOriginal =
        obj.has_view_access_original !== undefined
          ? obj.has_view_access_original
          : true;
      allHasViewAccessWatermark =
        obj.has_view_access_watermark !== undefined
          ? obj.has_view_access_watermark
          : true;
      allHasDownloadAccessOriginal =
        obj.has_download_access_original !== undefined
          ? obj.has_download_access_original
          : true;
      allHasDownloadAccessWatermark =
        obj.has_download_access_watermark !== undefined
          ? obj.has_download_access_watermark
          : true;
    }

    // Set the new properties on the current object (folder)
    obj.all_has_view_access_original = allHasViewAccessOriginal;
    obj.all_has_view_access_watermark = allHasViewAccessWatermark;
    obj.all_has_download_access_original = allHasDownloadAccessOriginal;
    obj.all_has_download_access_watermark = allHasDownloadAccessWatermark;

    // Return the permissions for the current object (folder)
    return {
      allHasViewAccessOriginal,
      allHasViewAccessWatermark,
      allHasDownloadAccessOriginal,
      allHasDownloadAccessWatermark,
    };
  }

  async getAllFilesByUserId(
    room_id: string,
    parent_folder_id: string,
    user_id: string,
  ) {
    try {
      // console.log(room_id,'dasdas')
      if (!room_id) throw new NotFoundException('Missing Fields');

      const user = await this.userRepository.findOne({
        relations: [
          'organization.rooms.groups',
          'organization_created.rooms.groups',
          'organization.subscription',
          'organization_created.subscription',
          'groups',
          'room',
        ],
        where: { id: user_id },
      });

      if(user){
        if(user.role == UserRoleEnum.OWNER){
          // console.log(user, 'dsds');
          // return
          const room = user.organization_created.rooms.find(room=> room.id == room_id)
          // console.log(room,'groupp')
          const file_ids_in_org = [];

          const result = await this.getFoldersAndFilesByRoomId(
            room_id,
            parent_folder_id,
            null,
            file_ids_in_org,
          );

          // console.log(result,'result')
          const folderResult  = this.filterFolders(result[0])
          console.log(folderResult,'ewqeqwew')
          return folderResult
        }
        if(user.role == UserRoleEnum.GUEST || user.role == UserRoleEnum.ADMIN){
          const file_ids_in_org = [];
          const result = await this.getFoldersAndFilesByRoomId(
            room_id,
            parent_folder_id,
            null,
            file_ids_in_org,
          );
          const folderResult  = this.filterFolders(result[0])
          return folderResult
        }
      }
    } catch (error) {
      throw Error(error);
    }
  }

  private filterFolders(obj) {
    if (obj.type !== 'folder') {
      return null;
    }
    const filteredChildren = obj.children
      ? obj.children.map(child => this.filterFolders(child)).filter(child => child !== null)
      : [];
    return {
      ...obj,
      children: filteredChildren,
    };
  }
}
