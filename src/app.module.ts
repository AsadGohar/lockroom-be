import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { UploadsModule } from './uploads/uploads.module';
import { FoldersModule } from './folders/folders.module';
import { Folder } from './folders/entities/folder.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Register the ConfigModule here
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [User, Folder],
      synchronize: true,
      ssl:{
        rejectUnauthorized:false
      },
      // ssl:false
    }),
    UsersModule,
    UploadsModule,
    FoldersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
