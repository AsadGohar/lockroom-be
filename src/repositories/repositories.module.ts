import { Module } from '@nestjs/common';
import { RepositoriesService } from './repositories.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from './entities/repository.entity';
import { RepositoriesController } from './repositories.controller';
import { User } from 'src/users/entities/user.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Repository, User]), UsersModule
  ],
  controllers: [RepositoriesController],
  providers: [RepositoriesService],
  exports: [RepositoriesService]
})
export class RepositoriesModule {}
