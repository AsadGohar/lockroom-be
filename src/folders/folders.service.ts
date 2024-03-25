import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Folder } from './entities/folder.entity';
import { UsersService } from '../users/users.service';
import { FilesPermissions } from 'src/files-permissions/entities/files-permissions.entity';
import { GroupFilesPermissions } from 'src/group-files-permissions/entities/group-files-permissions.entity';
import { File } from 'src/files/entities/file.entity';
import { Organization } from 'src/organizations/entities/organization.entity';
import { formatBytes } from 'src/utils/converts.utils';
import { Group } from 'src/groups/entities/group.entity';
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
    @InjectRepository(FilesPermissions)
    private readonly fpRepository: Repository<FilesPermissions>,
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
    if(!parent_folder_id) throw new NotFoundException('parent folder required');
     
    //check if parent repo exists
    const parent_folder = await this.foldersRepository.findOne({
      relations: ['sub_folders'],
      where: {
        id: parent_folder_id,
      },
    });
    if (!parent_folder) throw new NotFoundException('parent folder found');
    // console.log(parent_folder,'parent')

    //check if child repos have duplicate name
    const child_folders_with_same_name = await this.foldersRepository.find({
      where: {
        parent_folder_id,
        name: name,
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

    console.log(current_tree_index + next, 'treehehehe');
    const new_folder = await this.foldersRepository.save({
      name,
      parent_folder_id,
      tree_index: current_tree_index + next,
      users: [user],
      organization: find_org,
    });

    const new_folder_1 = {
      ...new_folder,
      folder_name: new_folder.name,
      folder_parent_folder_id: new_folder.parent_folder_id,
      folder_tree_index: new_folder.tree_index,
      folder_createdAt: new_folder.createdAt,
      folder_id: new_folder.id,
    };

    const query = this.foldersRepository
      .createQueryBuilder('folder')
      .leftJoinAndSelect('folder.users', 'user')
      .where('user.id = :userId', { userId: user.id });

    if (parent_folder_id) {
      query.andWhere('folder.parent_folder_id = :parent_folder_id', {
        parent_folder_id,
      });
    } else {
      query.andWhere('folder.parent_folder_id IS NULL');
    }
    const data = await query.getMany();
    parent_folder.sub_folders.push(new_folder);
    const update_parent_folder =
      await this.foldersRepository.save(parent_folder);
    return {
      new_folder: new_folder_1,
      files_count: data.length,
      parent_folder: update_parent_folder,
    };
  }

  async findAll() {
    const repos = await this.foldersRepository.find();
  }

  async findAllByOrganization(organization_id: string, user_id: string) {
    const find_user = await this.userService.findOne({
      id: user_id,
    });

    if (find_user.role == 'admin') {
      const get_files = await this.fileRepository.find({
        relations: ['folder'],
        where: {
          organization: {
            id: find_user.organization_created.id,
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
          url: file.bucket_url,
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
        .groupBy('folder.id, user.id')
        .orderBy('folder.createdAt', 'ASC')
        .addSelect('folder.id', 'id') 
        .addSelect('folder.id', 'folder_id') 
        .getRawMany();

      const data = [...query1, ...file_data].sort(
        (a, b) => Number(a.folder_createdAt) - Number(b.folder_createdAt),
      );

      // console.log(data,'dasda')
      return {
        sub_folder_count: data,
      };
    }
    if (find_user.role == 'guest') {
      const find_group = await this.groupsRepository.find({
        where: {
          users: {
            id: find_user.id,
          },
        },
      });
      const group_files_permissions = await this.gfpRepository.find({
        relations: [
          'file_permission.permission',
          'file_permission.file',
          'file_permission.file.folder',
        ],
        where: {
          group: {
            id: In(find_group.map((item) => item.id)),
          },
          file_permission: {
            permission: {
              type: 'view',
              status: true,
            },
          },
        },
      });

      const file_data = group_files_permissions.map((item) => {
        return {
          name: item.file_permission.file.name,
          folder_tree_index: item.file_permission.file.tree_index,
          folder_id: item.file_permission.file.folder.id,
          folder_name: item.file_permission.file.folder.name,
          size: formatBytes(item.file_permission.file.size_bytes),
          mime_type: item.file_permission.file.mime_type,
          url: item.file_permission.file.bucket_url,
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

  async findAllByUserId(userId: string) {
    const repos = await this.foldersRepository.find({
      where: {
        users: {
          id: userId,
        },
      },
    });
    console.log(repos);
  }

  findOne(id: number) {
    return `This action returns a #${id} folder`;
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

  async remove(id: string) {
    return await this.foldersRepository.update(
      {
        id: id,
      },
      {
        is_deleted: true,
      },
    );
  }

  async createFolderWithDefaultPermissions(
    name: string,
    sub: string,
    parent_folder_id?: string,
  ) {
    const parent_folder = await this.foldersRepository.findOne({
      where: {
        id: parent_folder_id,
      },
    });
    if (!parent_folder) throw new NotFoundException('parent folder found');
    const child_folders_with_same_name = await this.foldersRepository.find({
      where: {
        parent_folder_id,
        name: name,
      },
    });
    if (child_folders_with_same_name.length > 0)
      throw new ConflictException('folder already exists with same name');

    const user = await this.userService.findOne({
      sub,
    });

    const all_child_folders = await this.foldersRepository.find({
      where: {
        parent_folder_id,
      },
    });

    const current_tree_index = `${parent_folder.tree_index}.`;
    const next =
      all_child_folders.length > 0 ? `${all_child_folders.length + 1}` : 1;

    console.log(current_tree_index + next, 'trehehehe1');

    if (!user) throw new NotFoundException('user not found');
    const new_folder = await this.foldersRepository.save({
      name,
      parent_folder_id,
      tree_index: current_tree_index + next,
      users: [user],
    });

    const new_folder_1 = {
      ...new_folder,
      folder_name: new_folder.name,
      folder_parent_folder_id: new_folder.parent_folder_id,
      folder_tree_index: new_folder.tree_index,
      folder_createdAt: new_folder.createdAt,
      folder_id: new_folder.id,
    };

    const query = this.foldersRepository
      .createQueryBuilder('folder')
      .leftJoinAndSelect('folder.users', 'user')
      .where('user.id = :userId', { userId: user.id });

    if (parent_folder_id) {
      query.andWhere('folder.parent_folder_id = :parent_folder_id', {
        parent_folder_id,
      });
    } else {
      query.andWhere('folder.parent_folder_id IS NULL');
    }
    await query.getMany();
    // return { new_folder: new_folder_1, files_count: data.length };

    // Associate default permissions
    // const defaultPermissions = ['view', 'delete', 'download']; // Adjust as needed
    // const folderPermissionAssociations = defaultPermissions.map(async permission => {
    //   const gpf = await this.gfpRepository.create({

    //   })
    // });

    // await this.gpfRepository.save(folderPermissionAssociations);

    // return folder;
  }
}
