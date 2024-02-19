import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  forwardRef,
  Inject
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtService } from '@nestjs/jwt';
// import { RepositoriesService } from 'src/repositories/repositories.service';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    // @Inject(forwardRef(()=> RepositoriesService))
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    // private readonly repoService: RepositoriesService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const existingUser = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('user already exists');
      }
      const user = await this.userRepository.save(createUserDto);
      const payload = { user_id: user.id, email: user.email };
      const access_token = this.jwtService.sign(payload);

      return {access_token}
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
