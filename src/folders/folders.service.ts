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
      where: { id: parent_folder_id },
    });
    if (!parent_folder) throw new NotFoundException('parent folder found');
    //check if child repos have duplicate name
    const child_folders_with_same_name = await this.foldersRepository.find({
      where: { parent_folder_id, name: name, is_deleted: false },
    });
    const folderwithSamedisplay_name = child_folders_with_same_name?.find(
      (folder) => folder?.display_name === name,
    );
    const user = await this.userService.findOne({ id: user_id });
    const all_child_folders = await this.foldersRepository.find({
      where: { parent_folder_id },
    });
    const all_child_files = await this.fileRepository.find({
      where: { is_deleted: false, folder: { id: parent_folder_id } },
    });
    const current_tree_index = `${parent_folder.tree_index}.`;
    const next =
      all_child_folders.length + all_child_files.length > 0
        ? `${all_child_folders.length + all_child_files.length + 1}`
        : 1;
    if (!user) throw new NotFoundException('user not found');
    const find_org = await this.orgRepository.findOne({
      where: { id: organization_id },
    });
    const new_folder = await this.foldersRepository.save({
      display_name:
        child_folders_with_same_name?.length > 0 && folderwithSamedisplay_name
          ? `${name} (${child_folders_with_same_name?.length + 1})`
          : name,
      name: name,
      parent_folder_id,
      tree_index: current_tree_index + next,
      users: [user],
      organization: find_org,
      absolute_path: parent_folder.absolute_path + '/' + name,
      display_tree_index: parent_folder.display_tree_index + '.' + next,
      absolute_path_ids: '',
    });
    await this.foldersRepository.update(new_folder.id, {
      absolute_path_ids: parent_folder.absolute_path_ids + '/' + new_folder.id,
    });
    const new_folder_1 = {
      ...new_folder,
      folder_name: new_folder.display_name,
      folder_parent_folder_id: new_folder.parent_folder_id,
      folder_tree_index: new_folder.tree_index,
      folder_createdAt: new_folder.createdAt,
      folder_id: new_folder.id,
      folder_display_index: new_folder.display_tree_index,
      folder_absolute_path_ids:
        parent_folder.absolute_path_ids + '/' + new_folder.id,
    };
    parent_folder.sub_folders.push(new_folder);
    const update_parent_folder =
      await this.foldersRepository.save(parent_folder);
    return { new_folder: new_folder_1, parent_folder: update_parent_folder };
  }
  async findAll() {
    return await this.foldersRepository.find();
  }
  async findAllByOrganization(
    organization_id: string,
    user_id: string,
    isDeleted?: boolean,
  ) {
    if (!organization_id || !user_id)
      throw new NotFoundException('Missing Fields');
    const find_user = await this.userService.findOne({ id: user_id });
    if (
      find_user.role == UserRoleEnum.ADMIN ||
      find_user.role == UserRoleEnum.OWNER
    ) {
      const org =
        find_user.role == UserRoleEnum.OWNER
          ? find_user.organization_created.id
          : find_user.organizations_added_in[0].id;
      let get_files: File[];
      if (isDeleted) {
        get_files = await this.fileRepository?.find({
          relations: ['folder', 'versions'],
          where: { this_deleted: true, organization: { id: org } },
        });
      } else {
        get_files = await this.fileRepository?.find({
          relations: ['folder', 'versions'],
          where: { is_deleted: false, organization: { id: org } },
        });
      }
      const file_data = get_files.map((file) => {
        return {
          name: file.name,
          folder_tree_index: file.tree_index,
          folder_id: file.folder.id,
          folder_name: file.folder.display_name,
          size: formatBytes(file.size_bytes),
          mime_type: file.mime_type,
          url: file.versions?.find(
            (versions) => versions.id == file.current_version_id,
          )?.bucket_url,
          file_id: file.id,
          extension: file.extension,
          folder_createdAt: file.createdAt,
          id: file.id,
          folder_display_tree_index: file.display_tree_index,
        };
      });

      let query1;

      if (isDeleted) {
        query1 = await this.foldersRepository
          .createQueryBuilder('folder')
          .leftJoinAndSelect('folder.users', 'user')
          .leftJoin('folder.sub_folders', 'sub_folder')
          .addSelect('COUNT(DISTINCT sub_folder.id)', 'sub_folder_count')
          .where('folder.organization.id = :organizationId', {
            organizationId: organization_id,
          })
          .andWhere(`folder.is_deleted = :isDeleted`, {
            isDeleted: isDeleted || false,
          })
          .andWhere(`folder.this_deleted = :isDeleted`, {
            isDeleted: isDeleted || false,
          })
          .orWhere('folder.is_partial_restored IS NULL')
          .groupBy('folder.id, user.id')
          .orderBy('folder.createdAt', 'ASC')
          .addSelect('folder.id', 'id')
          .addSelect('folder.id', 'folder_id')
          .getRawMany();
      } else {
        query1 = await this.foldersRepository
          .createQueryBuilder('folder')
          .leftJoinAndSelect('folder.users', 'user')
          .leftJoin('folder.sub_folders', 'sub_folder')
          .addSelect('COUNT(DISTINCT sub_folder.id)', 'sub_folder_count')
          .where('folder.organization.id = :organizationId', {
            organizationId: organization_id,
          })
          .andWhere(`folder.is_deleted = :isDeleted`, {
            isDeleted: isDeleted || false,
          })
          .andWhere(`folder.this_deleted = :isDeleted`, {
            isDeleted: isDeleted || false,
          })
          .orWhere('folder.is_partial_restored = :isPartialRestored', {
            isPartialRestored: true,
          })
          .orWhere('folder.is_partial_restored IS NULL')
          .groupBy('folder.id, user.id')
          .orderBy('folder.createdAt', 'ASC')
          .addSelect('folder.id', 'id')
          .addSelect('folder.id', 'folder_id')
          .getRawMany();
      }

      const data = this.sortByFolderTreeIndex([...query1, ...file_data]);
      return { sub_folder_count: data };
    }
    if (find_user.role == UserRoleEnum.GUEST) {
      const find_group = await this.groupsRepository?.find({
        where: { users: { id: find_user.id } },
      });
      const group_files_permissions = await this.gfpRepository?.find({
        relations: [
          'file_permission.permission',
          'file_permission.file',
          'file_permission.file.versions',
          'file_permission.file.folder',
        ],
        where: {
          group: { id: In(find_group.map((item) => item.id)) },
          file_permission: {
            permission: {
              type: In([
                FilePermissionEnum.VIEW_ORIGINAL,
                FilePermissionEnum.VIEW_WATERMARKED,
              ]),
              status: true,
            },
            file: {
              is_deleted: isDeleted || false,
              folder: { is_deleted: isDeleted || false },
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
          folder_name: item.file_permission.file.folder.display_name,
          size: formatBytes(item.file_permission.file.size_bytes),
          mime_type: item.file_permission.file.mime_type,
          url: item.file_permission.file.versions?.find(
            (versions) => versions.id == current_version,
          ).bucket_url,
          file_id: item.file_permission.file.id,
          folder_createdAt: item.file_permission.file.createdAt,
          id: item.file_permission.file.id,
          folder_display_tree_index:
            item?.file_permission?.file?.display_tree_index,
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
        .andWhere('folder.is_deleted = :isDeleted', {
          isDeleted: isDeleted || false,
        })
        .groupBy('folder.id, user.id')
        .orderBy('folder.createdAt', 'ASC')
        .addSelect('folder.id', 'id')
        .addSelect('folder.id', 'folder_id')
        .getRawMany();
      const data = this.sortByFolderTreeIndex([...query1, ...file_data]);
      return { sub_folder_count: data };
    }
  }
  async findAllByUserId(user_id: string) {
    if (!user_id) throw new NotFoundException('Missing Fields');
    return await this.foldersRepository.find({
      where: { users: { id: user_id } },
    });
  }
  async update(prev_name: string, new_name: string, parent_folder_id?: string) {
    const findRepo = await this.foldersRepository.find({
      where: { parent_folder_id, name: prev_name },
    });
    if (findRepo.length == 0) throw new NotFoundException('folder not found');
    if (findRepo.length > 1)
      throw new ConflictException('duplicate folder found with old name');
    const findRepoWithNewName = await this.foldersRepository.find({
      where: { parent_folder_id, name: new_name },
    });
    if (findRepoWithNewName.length > 0)
      throw new ConflictException('duplicate folder found with new name');
    await this.foldersRepository.update(
      { parent_folder_id, name: prev_name },
      { name: new_name },
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
    if (folder.files && folder.files.length > 0)
      for (const file of folder.files) {
        const file_access = {
          type: 'file',
          name: file.name,
          index: file.tree_index,
          mime_type: file.mime_type,
          file_id: file.id,
          url: file.versions?.find(
            (version) => version.id == file.current_version_id,
          ).bucket_url,
          extension: file.extension,
        };
        folder_files.children.push(file_access);
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
    const root_folders = await this.foldersRepository?.find({
      where: {
        organization: { id: organization_id },
        parent_folder_id: parent_folder_id,
      },
      relations: ['sub_folders', 'files.organization'],
      order: { tree_index: 'ASC' },
    });
    const folder_file_structures = [];
    if (root_folders?.length > 0) {
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
    const required_files = [...sub_folders_ids, id].map(async (folder_id) => {
      const file = await this.fileRepository.find({
        where: { folder: { id: folder_id } },
      });
      if (file) {
        return file;
      }
    });
    const files_promise = await Promise.all(required_files);
    const files_to_delete = files_promise.flat();
    try {
      await this.foldersRepository.update(id, {
        this_deleted: true,
        is_partial_restored: false,
      });
      await this.fileRepository.update(
        { id: In(files_to_delete?.map((file) => file.id)) },
        { is_deleted: true },
      );
      return await this.foldersRepository.update(
        { id: In([...sub_folders_ids, id]) },
        { is_deleted: true },
      );
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
  async restore(id: string, org_id: string) {
    const to_restore = await this.getAllFilesByOrg(org_id, id);
    const sub_folders_ids = to_restore?.folder_ids;

    const required_files = [...sub_folders_ids, id].map(async (folder_id) => {
      const file = await this.fileRepository.find({
        where: { folder: { id: folder_id } },
      });
      if (file) {
        return file;
      }
    });
    const files_promise = await Promise.all(required_files);
    const files_to_delete = files_promise.flat();
    const current_folder = await this.foldersRepository.findOne({
      where: { id },
    });
    const folders_to_restore = current_folder.absolute_path_ids
      ?.split('/')
      ?.slice(1);
    await this.foldersRepository.update(
      { id: In(folders_to_restore) },
      { is_partial_restored: true },
    );
    const child_folders_in_parent = await this.foldersRepository.find({
      where: {
        parent_folder_id: current_folder?.parent_folder_id,
        is_deleted: false,
        name: current_folder.name,
      },
    });
    const same_named_folder = child_folders_in_parent.find(
      (folder) => folder.display_name === current_folder.name,
    );
    try {
      if (same_named_folder && child_folders_in_parent?.length > 0) {
        await this.foldersRepository.update(id, {
          display_name:
            current_folder?.name + `(${child_folders_in_parent?.length + 1})`,
        });
      }
      await this.foldersRepository.update(id, { this_deleted: false });
      await this.fileRepository.update(
        { id: In(files_to_delete?.map((file) => file.id)) },
        { is_deleted: false },
      );
      return await this.foldersRepository.update(
        { id: In([...sub_folders_ids, id]) },
        { is_deleted: false },
      );
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
  async rename(folder_id: string, new_name: string, parent_folder_id: string) {
    try {
      const check_same_name_folder = await this.foldersRepository.find({
        where: { parent_folder_id, name: new_name, is_deleted: false },
      });
      const folder_with_same_display_name = check_same_name_folder?.find(
        (folder) => folder.display_name === new_name,
      );
      return await this.foldersRepository.update(
        { id: folder_id },
        {
          name: new_name,
          display_name:
            check_same_name_folder?.length > 0 && folder_with_same_display_name
              ? `${new_name} (${check_same_name_folder?.length + 1})`
              : new_name,
        },
      );
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
  private sortByFolderTreeIndex(data) {
    data.sort((a, b) => {
      const indexA = a.folder_display_tree_index.split('.').map(Number);
      const indexB = b.folder_display_tree_index.split('.').map(Number);
      for (let i = 0; i < Math.max(indexA.length, indexB.length); i++) {
        if (indexA[i] === indexB[i]) continue;
        else return indexA[i] - indexB[i];
      }
      return 0;
    });
    return data;
  }

  private async updateDisplayTreeIndex(
    parentId: string,
    parentDisplayTreeIndex: string,
  ) {
    const child_folders = await this.foldersRepository.find({
      where: { parent_folder_id: parentId },
    });
    const child_files = await this.fileRepository.find({
      where: { folder: { id: parentId } },
    });

    for (let index = 0; index < child_folders.length; index++) {
      const child_folder = child_folders[index];
      const new_display_tree_index = `${parentDisplayTreeIndex}.${index + 1}`;
      await this.foldersRepository.update(child_folder.id, {
        display_tree_index: new_display_tree_index,
      });

      await this.updateDisplayTreeIndex(
        child_folder.id,
        new_display_tree_index,
      );
    }

    for (let index = 0; index < child_files.length; index++) {
      const childFile = child_files[index];
      const new_display_tree_index = `${parentDisplayTreeIndex}.${index + 1}`;
      await this.fileRepository.update(childFile.id, {
        display_tree_index: new_display_tree_index,
      });
    }
  }

  async rearrangeFolderAndFiles(
    data: any[],
    organization_id: string,
    user_id: string,
  ) {
    for (const element of data) {
      if (element.type === 'folder') {
        await this.updateDisplayTreeIndex(
          element.id,
          element.folder_display_tree_index,
        );
        await this.foldersRepository.update(element.id, {
          display_tree_index: element.folder_display_tree_index,
        });
      } else if (element.type === 'file') {
        await this.fileRepository.update(element.id, {
          display_tree_index: element.folder_display_tree_index,
        });
      }
    }

    return {
      success: true,
      new_data: await this.findAllByOrganization(organization_id, user_id),
    };
  }
}
