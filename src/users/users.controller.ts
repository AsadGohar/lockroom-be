import {
  Controller,
  Post,
  Get,
  Patch,
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
    // console.log(createUserDto, 'dto');
    return await this.usersService.create(createUserDto);
  }

  @Post('login')
  login(@Body('email') email: string, @Body('password') password: string) {
    return this.usersService.loginUser(email, password);
  }

  @UseGuards(AuthGuard)
  @Post('find-groups')
  findAllGroupsByUserId(@Body('room_id') room_id: string, @Request() request) {
    return this.usersService.getAllGroups(
      room_id,
      request?.decoded_data?.user_id,
    );
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

  @UseGuards(AuthGuard)
  @Patch('confirm-password')
  updatePassword(@Body('password') password: string, @Request() request) {
    return this.usersService.updatePassword(
      request?.decoded_data?.user_id,
      password,
    );
  }

  @UseGuards(AuthGuard)
  @Post('new-room')
  createNewRoom(
    @Body('room_name') room_name: string,
    @Body('organization_id') organization_id: string,
    @Request() request,
  ) {
    return this.usersService.createNewRoom(
      room_name,
      organization_id,
      request?.decoded_data?.user_id,
    );
  }

  @UseGuards(AuthGuard)
  @Post('fetch-room')
  getAllRooms(
    @Body('organization_id') organization_id: string,
    @Request() request,
  ) {
    return this.usersService.getRoomsByUserId(
      organization_id,
      request?.decoded_data?.user_id,
    );
  }
}
