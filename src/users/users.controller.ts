import {
  Controller,
  Post,
  Body,
  Res,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { SkipThrottle } from '@nestjs/throttler';
import { AuthGuard } from 'src/guards/auth.guard';

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
    return {
      access_token: data.access_token,
      id: data.id,
      user: data.user,
      organizations: data.organizations,
    };
  }

  @Post('login')
  login(@Body('email') email: string, @Body('password') password: string) {
    return this.usersService.loginUser(email, password);
  }

  @UseGuards(AuthGuard)
  @Post('find-groups')
  findAllGroupsByUserId(@Request() request) {
    return this.usersService.getAllGroups(request?.decoded_data?.user_id);
  }

  @UseGuards(AuthGuard)
  @Post('verify-email')
  verifyEmail(@Request() request) {
    return this.usersService.verifyEmail(request?.decoded_data?.user_id);
  }

  @UseGuards(AuthGuard)
  @Post('user-token')
  getUserByToken(@Request() request) {
    return this.usersService.getUserByToken(request?.decoded_data?.user_id);
  }

  @UseGuards(AuthGuard)
  @Post('clear')
  deleteDB() {
    return this.usersService.truncateUserTable();
  }

  //jwt token coming from google, don't use auth guard
  @Post('login-gmail')
  async loginWithGmail(@Body('jwt_token') jwt_token: string) {
    const data = await this.usersService.loginWithGoogle(jwt_token);
    return data;
  }
}
