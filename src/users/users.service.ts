import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtService } from '@nestjs/jwt';
import { Folder } from 'src/folders/entities/folder.entity';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    @InjectRepository(Folder)
    private readonly folderRepository: Repository<Folder>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const existingUser = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        const payload = { user_id: existingUser.id, email: existingUser.email };
        const access_token = this.jwtService.sign(payload);
        const folders =  await this.folderRepository.find({
         where: {
          users: existingUser
         }
        });
        return { access_token, folders };
      }
      const user = await this.userRepository.save(createUserDto);
      const payload = { user_id: user.id, email: user.email };
      const access_token = this.jwtService.sign(payload);

      const folder = await this.folderRepository.save({
        name: 'Home',
        parentFolderId: null,
        tree_index: '1',
        users: [user],
      });

      return { access_token, folders: [folder] };
    } catch (error) {
      console.log(error, 'err');
      throw new InternalServerErrorException(
        error.message || 'failed to create user',
      );
    }
  }

  findAll() {
    try {
      return this.userRepository.find();
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async findOne(where: any) {
    return await this.userRepository.findOne({
      where: where,
    });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
