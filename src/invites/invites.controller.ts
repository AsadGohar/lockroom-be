import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { InvitesService } from './invites.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { UpdateInviteDto } from './dto/update-invite.dto';

@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post()
  create(@Body() createInviteDto: CreateInviteDto) {
    return this.invitesService.create(createInviteDto);
  }

  @Post('sender')
  findInvitesBySenderId(@Body('sender_id') sender_id: string) {
    return this.invitesService.findBySenderId(sender_id);
  }

  @Post('email-invite')
  getEmailByToken(@Body('jwt_token') jwt_token: string) {
    return this.invitesService.getEmailByToken(jwt_token);
  }

  @Post('add-invite')
  addInvitedUser(
    @Body('first_name') first_name: string,
    @Body('last_name') last_name: string,
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('phone_number') phone_number: string,
    @Body('jwt_token') jwt_token: string,
  ) {
    return this.invitesService.addInvitedUser(
      email,
      password,
      first_name,
      last_name,
      phone_number,
      jwt_token,
    );
  }

  @Get()
  findAll() {
    return this.invitesService.findAll();
  }
}
