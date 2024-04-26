import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { AuthGuard } from 'src/guards/auth.guard';
@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @UseGuards(AuthGuard)
  @Post('sender')
  findInvitesBySenderId(@Request() request) {
    return this.invitesService.findBySenderId(request.decoded_data.user_id);
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
}
