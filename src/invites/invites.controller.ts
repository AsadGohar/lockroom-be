import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
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
  findInvitesBySenderId(@Body('sender_id') sender_id:string) {
    return this.invitesService.findBySenderId(sender_id);
  }

  @Post('email-invite')
  getEmailByToken(@Body('jwt_token') jwt_token: string) {
    return this.invitesService.getEmailByToken(jwt_token);
  }

  @Get()
  findAll() {
    return this.invitesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invitesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInviteDto: UpdateInviteDto) {
    return this.invitesService.update(+id, updateInviteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.invitesService.remove(+id);
  }
}
