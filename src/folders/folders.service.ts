import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Folder } from './entities/folder.entity';
import { UsersService } from '../users/users.service';
import { GroupFilesPermissions } from 'src/group-files-permissions/entities/group-files-permissions.entity';
import { File } from 'src/files/entities/file.entity';
import { Organization } from 'src/organizations/entities/organization.entity';
import { formatBytes } from 'src/utils/converts.utils';
import { Group } from 'src/groups/entities/group.entity';
import { UserRoleEnum, FilePermissionEnum } from 'src/types/enums';

@Injectable()
export class FoldersService {
  constructor(
    @InjectRepository(Folder)
    private readonly foldersRepository: Repository<Folder>,
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
    @InjectRepository(GroupFilesPermissions)
    private readonly gfpRepository: Repository<GroupFilesPermissions>,

    private readonly userService: UsersService,
  ) {}

  async create(
    name: string,
    user_id: string,
    organization_id: string,
    parent_folder_id?: string,
  ) {
    if (!parent_folder_id)
      throw new NotFoundException('parent folder required');

    //check if parent repo exists
    const parent_folder = await this.foldersRepository.findOne({
      relations: ['sub_folders'],
      where: {
        id: parent_folder_id,
      },
    });
    if (!parent_folder) throw new NotFoundException('parent folder found');

    //check if child repos have duplicate name
    const child_folders_with_same_name = await this.foldersRepository.find({
      where: {
        parent_folder_id,
        name: name,
        is_deleted: false,
      },
    });
    if (child_folders_with_same_name.length > 0)
      throw new ConflictException('folder already exists with same name');

    const user = await this.userService.findOne({
      id: user_id,
    });

    const all_child_folders = await this.foldersRepository.find({
      where: {
        parent_folder_id,
      },
    });

    const all_child_files = await this.fileRepository.find({
      where: {
        is_deleted: false,
        folder: {
          id: parent_folder_id,
        },
      },
    });

    const current_tree_index = `${parent_folder.tree_index}.`;
    const next =
      all_child_folders.length + all_child_files.length > 0
        ? `${all_child_folders.length + all_child_files.length + 1}`
        : 1;

    if (!user) throw new NotFoundException('user not found');

    const find_org = await this.orgRepository.findOne({
      where: {
        id: organization_id,
      },
    });

    const new_folder = await this.foldersRepository.save({
      name,
      parent_folder_id,
      tree_index: current_tree_index + next,
      users: [user],
      organization: find_org,
      absolute_path: parent_folder.absolute_path + '/' + name,
    });

    const new_folder_1 = {
      ...new_folder,
      folder_name: new_folder.name,
      folder_parent_folder_id: new_folder.parent_folder_id,
      folder_tree_index: new_folder.tree_index,
      folder_createdAt: new_folder.createdAt,
      folder_id: new_folder.id,
    };

    // const query = this.foldersRepository
    //   .createQueryBuilder('folder')
    //   .leftJoinAndSelect('folder.users', 'user')
    //   .where('user.id = :user_id', { user_id: user.id });

    if (parent_folder_id) {
      // query.andWhere('folder.parent_folder_id = :parent_folder_id', {
      //   parent_folder_id,
      // });
    } else {
      // query.andWhere('folder.parent_folder_id IS NULL');
    }
    // const data = await query.getMany();
    parent_folder.sub_folders.push(new_folder);
    const update_parent_folder =
      await this.foldersRepository.save(parent_folder);
    return {
      new_folder: new_folder_1,
      // files_count: data.length,
      parent_folder: update_parent_folder,
    };
  }

  async findAll() {
    return await this.foldersRepository.find();
  }

  async findAllByOrganization(organization_id: string, user_id: string) {
    if (!organization_id || !user_id)
      throw new NotFoundException('Missing Fields');

    const find_user = await this.userService.findOne({
      id: user_id,
    });

    if (
      find_user.role == UserRoleEnum.ADMIN ||
      find_user.role == UserRoleEnum.OWNER
    ) {
      const org =
        find_user.role == UserRoleEnum.OWNER
          ? find_user.organization_created.id
          : find_user.organizations_added_in[0].id;

      const get_files = await this.fileRepository.find({
        relations: ['folder', 'versions'],
        where: {
          is_deleted: false,
          organization: {
            id: org,
          },
          folder: {
            is_deleted: false,
          },
        },
      });

      const file_data = get_files.map((file) => {
        return {
          name: file.name,
          folder_tree_index: file.tree_index,
          folder_id: file.folder.id,
          folder_name: file.folder.name,
          size: formatBytes(file.size_bytes),
          mime_type: file.mime_type,
          url: file.versions.find(
            (versions) => versions.id == file.current_version_id,
          ).bucket_url,
          file_id: file.id,
          extension: file.extension,
          folder_createdAt: file.createdAt,
          id: file.id,
        };
      });

      const query1 = await this.foldersRepository
        .createQueryBuilder('folder')
        .leftJoinAndSelect('folder.users', 'user')
        .leftJoin('folder.sub_folders', 'sub_folder')
        .addSelect('COUNT(DISTINCT sub_folder.id)', 'sub_folder_count')
        .where('folder.organization.id = :organizationId', {
          organizationId: organization_id,
        })
        .andWhere('folder.is_deleted = :isDeleted', { isDeleted: false })
        .groupBy('folder.id, user.id')
        .orderBy('folder.createdAt', 'ASC')
        .addSelect('folder.id', 'id')
        .addSelect('folder.id', 'folder_id')
        .getRawMany();

      const data = [...query1, ...file_data].sort(
        (a, b) => Number(a.folder_createdAt) - Number(b.folder_createdAt),
      );

      return {
        sub_folder_count: data,
      };
    }
    if (find_user.role == UserRoleEnum.GUEST) {
      const find_group = await this.groupsRepository.find({
        where: {
          users: {
            id: find_user.id,
          },
        },
      });
      // console.log(find_group,'gruppp')
      const group_files_permissions = await this.gfpRepository.find({
        relations: [
          'file_permission.permission',
          'file_permission.file',
          'file_permission.file.versions',
          'file_permission.file.folder',
        ],
        where: {
          group: {
            id: In(find_group.map((item) => item.id)),
          },
          file_permission: {
            permission: {
              type: In([
                FilePermissionEnum.VIEW_ORIGINAL,
                FilePermissionEnum.VIEW_WATERMARKED,
              ]),
              status: true,
            },
            file: {
              is_deleted: false,
              folder: {
                is_deleted: false,
              },
            },
          },
        },
      });

      const file_data = group_files_permissions.map((item) => {
        const current_version = item.file_permission.file.current_version_id;
        return {
          name: item.file_permission.file.name,
          folder_tree_index: item.file_permission.file.tree_index,
          folder_id: item.file_permission.file.folder.id,
          folder_name: item.file_permission.file.folder.name,
          size: formatBytes(item.file_permission.file.size_bytes),
          mime_type: item.file_permission.file.mime_type,
          url: item.file_permission.file.versions.find(
            (versions) => versions.id == current_version,
          ).bucket_url,
          file_id: item.file_permission.file.id,
          folder_createdAt: item.file_permission.file.createdAt,
          id: item.file_permission.file.id,
        };
      });

      const query1 = await this.foldersRepository
        .createQueryBuilder('folder')
        .leftJoinAndSelect('folder.users', 'user')
        .leftJoin('folder.sub_folders', 'sub_folder')
        .addSelect('COUNT(DISTINCT sub_folder.id)', 'sub_folder_count')
        .where('folder.organization.id = :organizationId', {
          organizationId: organization_id,
        })
        .andWhere('folder.is_deleted = :isDeleted', { isDeleted: false })
        .groupBy('folder.id, user.id')
        .orderBy('folder.createdAt', 'ASC')
        .addSelect('folder.id', 'id')
        .addSelect('folder.id', 'folder_id')
        .getRawMany();

      const data = [...query1, ...file_data].sort(
        (a, b) => Number(a.folder_createdAt) - Number(b.folder_createdAt),
      );

      return {
        sub_folder_count: data,
      };
    }
  }

  async findAllByUserId(user_id: string) {
    if (!user_id) throw new NotFoundException('Missing Fields');
    return await this.foldersRepository.find({
      where: {
        users: {
          id: user_id,
        },
      },
    });
  }

  async update(prev_name: string, new_name: string, parent_folder_id?: string) {
    const findRepo = await this.foldersRepository.find({
      where: {
        parent_folder_id,
        name: prev_name,
      },
    });

    if (findRepo.length == 0) throw new NotFoundException('folder not found');
    if (findRepo.length > 1)
      throw new ConflictException('duplicate folder found with old name');

    const findRepoWithNewName = await this.foldersRepository.find({
      where: {
        parent_folder_id,
        name: new_name,
      },
    });

    if (findRepoWithNewName.length > 0)
      throw new ConflictException('duplicate folder found with new name');

    await this.foldersRepository.update(
      {
        parent_folder_id,
        name: prev_name,
      },
      {
        name: new_name,
      },
    );
  }

  private async buildFolderFileStructure(folder: Folder) {
    const folder_files = {
      name: folder.name,
      id: folder.id,
      type: 'folder',
      index: folder.tree_index,
      children: [],
    };
    if (folder.files && folder.files.length > 0) {
      for (const file of folder.files) {
        const file_access = {
          type: 'file',
          name: file.name,
          index: file.tree_index,
          mime_type: file.mime_type,
          file_id: file.id,
          url: file.versions.find(
            (version) => version.id == file.current_version_id,
          ).bucket_url,
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

  private async getFoldersAndFilesByOrganizationId(
    organization_id: string,
    parent_folder_id: string,
    folder_ids: string[],
  ) {
    const root_folders = await this.foldersRepository.find({
      where: {
        organization: { id: organization_id },
        parent_folder_id: parent_folder_id,
        is_deleted: false,
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
        folder_ids?.push(root_folder?.id);
      }
      for (const sub of folder_file_structures) {
        const folder_file_structure =
          await this.getFoldersAndFilesByOrganizationId(
            organization_id,
            sub.id,
            folder_ids,
          );
        sub.children.push(...folder_file_structure);
      }
    }
    return folder_file_structures;
  }

  private async getAllFilesByOrg(
    organization_id: string,
    parent_folder_id: string,
  ) {
    try {
      if (!organization_id) throw new NotFoundException('Missing Fields');
      const folder_ids = [];
      await this.getFoldersAndFilesByOrganizationId(
        organization_id,
        parent_folder_id,
        folder_ids,
      );

      return { folder_ids };
    } catch (error) {
      throw Error(error);
    }
  }

  async softDelete(id: string, org_id: string) {
    const to_delete = await this.getAllFilesByOrg(org_id, id);

    const sub_folders_ids = to_delete?.folder_ids;

    try {
      return await this.foldersRepository.update(
        {
          id: In([...sub_folders_ids, id]),
        },
        {
          is_deleted: true,
        },
      );
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async rename(folder_id: string, new_name: string, parent_folder_id: string) {
    try {
      const check_same_name_folder = await this.foldersRepository.find({
        where: {
          parent_folder_id,
          name: new_name,
          is_deleted: false,
        },
      });
      if (check_same_name_folder.length > 0)
        return new ConflictException('folder with same already exists');
      return await this.foldersRepository.update(
        {
          id: folder_id,
        },
        {
          name: new_name,
        },
      );
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }
}
