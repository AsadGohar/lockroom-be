import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Folder } from './entities/folder.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class FoldersService {
  constructor(
    @InjectRepository(Folder)
    private readonly foldersRepository: Repository<Folder>,
    private readonly userService: UsersService,
  ) {}

  async create(name: string, sub: string, parentFolderId?: string) {
    //check if parent repo exists
    const parentFolder = await this.foldersRepository.findOne({
      where: {
        id: parentFolderId,
      },
    });
    if (!parentFolder) throw new NotFoundException('parent folder found');

    //check if child repos have duplicate name
    const childFoldersWithSameName = await this.foldersRepository.find({
      where: {
        parentFolderId,
        name: name,
      },
    });
    if (childFoldersWithSameName.length > 0)
      throw new ConflictException('folder already exists with same name');

    const user = await this.userService.findOne({
      sub,
    });

    const allChildFolders = await this.foldersRepository.find({
      where: {
        parentFolderId,
      },
    });

    const treeIndex = `${parentFolder.tree_index}.`;
    const next =
      allChildFolders.length > 0 ? `${allChildFolders.length + 1}` : 1;

    if (!user) throw new NotFoundException('user not found');
    await this.foldersRepository.save({
      name,
      parentFolderId,
      tree_index: treeIndex + next,
      users: [user],
    });

    const query = this.foldersRepository
      .createQueryBuilder('folder')
      .leftJoinAndSelect('folder.users', 'user')
      .where('user.id = :userId', { userId: user.id });

    if (parentFolderId) {
      query.andWhere('folder.parentFolderId = :parentFolderId', {
        parentFolderId,
      });
    } else {
      query.andWhere('folder.parentFolderId IS NULL');
    }

    return query.getMany();
  }

  async findAll() {
    const repos = await this.foldersRepository.find();
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

  async update(prev_name: string, new_name: string, parentFolderId?: string) {
    const findRepo = await this.foldersRepository.find({
      where: {
        parentFolderId,
        name: prev_name,
      },
    });

    if (findRepo.length == 0) throw new NotFoundException('folder not found');
    if (findRepo.length > 1)
      throw new ConflictException('duplicate folder found with old name');

    const findRepoWithNewName = await this.foldersRepository.find({
      where: {
        parentFolderId,
        name: new_name,
      },
    });

    if (findRepoWithNewName.length > 0)
      throw new ConflictException('duplicate folder found with new name');

    await this.foldersRepository.update(
      {
        parentFolderId,
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
}
