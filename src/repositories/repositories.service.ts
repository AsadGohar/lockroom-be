import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateRepositoryDto } from './dto/update-repository.dto';
import { Repository as Repo } from './entities/repository.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class RepositoriesService {
  constructor(
    @InjectRepository(Repo)
    private readonly repoRepository: Repository<Repo>,
    private readonly userService: UsersService,
  ) {}

  async create(name: string, userId: string, parentRepositoryId?: string) {
    const findRepo = await this.repoRepository.find({
      where: {
        name,
      },
    });

    if (findRepo.length > 0)
      throw new ConflictException('repository already exists with same name');
    const user = await this.userService.findOne({
      id: userId,
    });

    if (!user) throw new NotFoundException('user not found');
    return await this.repoRepository.save({
      name,
      parentRepositoryId,
      users: [user],
    });
  }

  async createSubRepo(
    name: string,
    userId: string,
    parentRepositoryId?: string,
  ) {
    const findRepos = await this.repoRepository.find({
      where: {
        parentRepositoryId,
      },
    });
    if (findRepos.length == 0)
      throw new NotFoundException('parent repository found');
    if (findRepos.length > 0) {
      const isDuplicate = findRepos.find((repo) => repo.name == name);

      if (isDuplicate)
        throw new ConflictException('repository already exists with same name');

      const user = await this.userService.findOne({
        id: userId,
      });

      if (!user) throw new NotFoundException('user not found');

      return await this.repoRepository.save({
        name,
        parentRepositoryId,
        users: [user],
      });
    } else {
      throw new NotFoundException('parent repository not found');
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
    console.log(repos)
  }

  findOne(id: number) {
    return `This action returns a #${id} repository`;
  }

  async update(
    prev_name: string,
    new_name: string,
    parentRepositoryId?: string,
  ) {
    const findRepo = await this.repoRepository.find({
      where: {
        parentRepositoryId,
        name: prev_name,
      },
    });

    if (findRepo.length == 0)
      throw new NotFoundException('repository not found');
    if (findRepo.length > 1)
      throw new ConflictException('duplicate repository found with old name');

    const findRepoWithNewName = await this.repoRepository.find({
      where: {
        parentRepositoryId,
        name: new_name,
      },
    });

    if (findRepoWithNewName.length > 0)
      throw new ConflictException('duplicate repository found with new name');

    await this.repoRepository.update(
      {
        parentRepositoryId,
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
        is_deletd: true,
      },
    );
  }
}
