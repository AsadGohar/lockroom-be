import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { InvitesService } from './invites.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { PartialInviteDto } from './dto/partial-invite.dto';
@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @UseGuards(AuthGuard)
  @Post('sender')
  findInvitesBySenderId(@Request() request) {
    return this.invitesService.findBySenderId(request.decoded_data.user_id);
  }

  @Post('email-invite')
  getEmailByToken(@Body(ValidationPipe) dto: PartialInviteDto) {
    return this.invitesService.getEmailByToken(dto);
  }

  @Post('add-invite')
  addInvitedUser(@Body(ValidationPipe) dto: PartialInviteDto) {
    return this.invitesService.addInvitedUser(dto);
  }
}
