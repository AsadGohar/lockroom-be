import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Res,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/user.dto';
import { SkipThrottle } from '@nestjs/throttler';
import { AuthGuard } from 'src/guards/auth.guard';
import { PartialUserDto } from './dto/partial-user.dto';
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
  login(@Body(ValidationPipe) dto:PartialUserDto) {
    return this.usersService.loginUser(dto);
  }

  @UseGuards(AuthGuard)
  @Post('find-groups')
  findAllGroupsByUserId(@Body('organization_id') organization_id: string, @Request() request) {
    return this.usersService.getAllGroups(organization_id,request?.decoded_data?.user_id);
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
  @Post('verify-otp')
  verifyOtp(@Body('otp') otp: string, @Request() request) {
    return this.usersService.verifyOTP(otp, request?.decoded_data?.user_id);
  }

  @UseGuards(AuthGuard)
  @Post('verify-phone')
  verifyPhone(@Body('otp') otp: string, @Request() request) {
    return this.usersService.verifyPhone(otp, request?.decoded_data?.user_id);
  }

  @UseGuards(AuthGuard)
  @Get('resend-otp')
  resend(@Request() request) {
    return this.usersService.resendOTP(request?.decoded_data?.user_id);
  }

  @UseGuards(AuthGuard)
  @Get('generate-qrcode')
  generateQRcode(@Request() request) {
    return this.usersService.generateQRcode(request?.decoded_data?.user_id);
  }

  @UseGuards(AuthGuard)
  @Post('verify-authenticator-code')
  verifyAuthenticatorCode(@Body('code') code: string, @Request() request) {
    return this.usersService.verifyAuthenticatorCode(
      code,
      request?.decoded_data?.user_id,
    );
  }

  @UseGuards(AuthGuard)
  @Patch('update-auth-type')
  setAuthType(@Body('two_fa_type') two_fa_type: string, @Request() request) {
    return this.usersService.setAuthenticator(
      two_fa_type,
      request?.decoded_data?.user_id,
    );
  }

  // @UseGuards(AuthGuard)
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

  @UseGuards(AuthGuard)
  @Patch('update-view')
  updateViewType(@Body('view_type') view_type: string, @Request() request) {
    return this.usersService.updateViewType(
      view_type,
      request?.decoded_data?.user_id,
    );
  }
}
