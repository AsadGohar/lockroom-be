import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('users')
@SkipThrottle()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('/register')
  async create(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) res,
  ) {
    const data = await this.usersService.create(createUserDto);
    res.cookie('sWTNNOCEN', data.access_token, {
      expires: new Date(Date.now() + 3600000),
    });
    // console.log(data,'dsa')
    return {
      access_token: data.access_token,
      id: data.id,
      user: data.user,
      organizations: data.organizations,
    };
  }

  @Post('find-groups')
  findAllGroupsByUserId(@Body('userId') userId: string) {
    return this.usersService.getAllGroups(userId);
  }

  @Post('login')
  login(@Body('email') email: string, @Body('password') password: string) {
    return this.usersService.loginUser(email, password);
  }

  @Post('verify-email')
  verifyEmail(@Body('jwt_token') jwt_token: string) {
    return this.usersService.verifyEmail(jwt_token);
  }

  @Post('login-gmail')
  async loginWithGmail(@Body('jwt_token') jwt_token: string) {
    const data=  await this.usersService.loginWithGoogle(jwt_token);
    // console.log(data,'datas')
    return data
  }

  @Post('user-token')
  getUserByToken(@Body('jwt_token') jwt_token: string) {
    return this.usersService.getUserByToken(jwt_token);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Post('clear')
  deleteDB(@Param('id') id: string) {
    return this.usersService.truncateUserTable();
  }
}
