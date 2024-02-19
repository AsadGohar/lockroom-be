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
    private readonly repoRepository: Repository<Folder>,
    private readonly userService: UsersService,
  ) {}

  async create(name: string, sub: string, parentFolderId?: string) {

    //check if parent repo exists
    const parentRepository = await this.repoRepository.findOne({
      where: {
        id: parentFolderId,
      },
    });
    if (!parentRepository) throw new NotFoundException('parent folder found');

    //check if child repos have duplicate name
    const childRepos = await this.repoRepository.find({
      where: {
        parentFolderId,
        name: name,
      },
    });
    if (childRepos.length > 0) throw new ConflictException('folder already exists with same name');

    const user = await this.userService.findOne({
      sub,
    });

    const treeIndex = parentRepository
      ? `${parentRepository.tree_index}.${parentRepository.subFolders.length + 1}`
      : '1';

    if (!user) throw new NotFoundException('user not found');
    await this.repoRepository.save({
      name,
      parentFolderId,
      tree_index: Number(treeIndex),
      users: [user],
    });
    return await this.findAll();
  }

  async createSubRepo(
    name: string,
    userId: string,
    parentFolderId?: string,
  ) {
    const findRepos = await this.repoRepository.find({
      where: {
        parentFolderId,
      },
    });
    if (findRepos.length == 0)
      throw new NotFoundException('parent folder found');
    if (findRepos.length > 0) {
      const isDuplicate = findRepos.find((repo) => repo.name == name);

      if (isDuplicate)
        throw new ConflictException('folder already exists with same name');

      const user = await this.userService.findOne({
        id: userId,
      });

      if (!user) throw new NotFoundException('user not found');

      return await this.repoRepository.save({
        name,
        parentFolderId,
        users: [user],
      });
    } else {
      throw new NotFoundException('parent folder not found');
    }
  }

  async findAll() {
    const repos = await this.repoRepository.find();
  }

  async findAllByUserId(userId: string) {
    const repos = await this.repoRepository.find({
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

  async update(
    prev_name: string,
    new_name: string,
    parentFolderId?: string,
  ) {
    const findRepo = await this.repoRepository.find({
      where: {
        parentFolderId,
        name: prev_name,
      },
    });

    if (findRepo.length == 0)
      throw new NotFoundException('folder not found');
    if (findRepo.length > 1)
      throw new ConflictException('duplicate folder found with old name');

    const findRepoWithNewName = await this.repoRepository.find({
      where: {
        parentFolderId,
        name: new_name,
      },
    });

    if (findRepoWithNewName.length > 0)
      throw new ConflictException('duplicate folder found with new name');

    await this.repoRepository.update(
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
    return await this.repoRepository.update(
      {
        id: id,
      },
      {
        is_deleted: true,
      },
    );
  }
}
