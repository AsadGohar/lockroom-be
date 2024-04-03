import {
  Controller,
  Post,
  Body,
  UseGuards,
  UnauthorizedException,
  Request,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/email/email.service';
import { GroupsService } from 'src/groups/groups.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { InvitesService } from 'src/invites/invites.service';
import { UsersService } from 'src/users/users.service';
import { inviteTemplate } from 'src/utils/email.templates';
import { MailDto } from './dto/mail.dto';
@Controller('mail')
export class MailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly inviteService: InvitesService,
    private readonly userService: UsersService,
    private readonly groupService: GroupsService,
    private readonly jwtService: JwtService,
  ) {}

  @UseGuards(AuthGuard)
  @Post('send-invites')
  async sendEmail(@Body(ValidationPipe) dto: MailDto, @Request() request) {
    try {
      let { emails, group_id, organization_id } = dto;
      console.log(
        'SEND INVITES TO',
        emails,
        'BY',
        request.decoded_data.user_id,
      );
      if (!request.decoded_data.user_id)
        throw new UnauthorizedException('Sender Id is Missing');
      const new_users = [];
      const senderUser = await this.userService.findOne({
        id: request.decoded_data.user_id,
      });
      // console.log(request.decoded_data.user_id,'dsads')
      if (!senderUser) throw new NotFoundException('sender user not found');
      await Promise.all(
        emails.map(async (email: string) => {
          const invitedUserAlreadyExists = await this.userService.findOne({
            email,
          });
          if (invitedUserAlreadyExists) return;
          new_users.push(email);
        }),
      );
      if (new_users.length == 0) {
        throw new NotFoundException('no user found to invite');
      }
      const { invites } = await this.inviteService.sendInvitesBySenderId(
        request.decoded_data.user_id,
        new_users,
        group_id,
        organization_id,
      );
      if (invites.length > 0) {
        const sendEmails = invites.map((invite) => {
          const payload = { invite_id: invite.id };
          const access_token = this.jwtService.sign(payload, {
            secret: process.env.JWT_SECRET,
          });
          const link = `${process.env.FE_HOST}/authentication/signup?confirm=${access_token}`;
          const mail = {
            to: invite.sent_to,
            subject: 'Invited to LockRoom',
            from:
              String(process.env.VERIFIED_SENDER_EMAIL) ||
              'waleed@lockroom.com',
            text: 'Hello',
            html: inviteTemplate(senderUser.first_name, link, 'Create Account'),
          };
          return this.emailService.send(mail);
        });
        const result = await Promise.all(sendEmails);
        const group_users =
          await this.groupService.findAllUsersInGroup({id:group_id});
        if (result.length > 0) {
          return {
            data: result,
            message: 'Emails Sent Successfully',
            invites,
            group_users,
          };
        }
      }
      if (new_users.length == 0) {
        const group_users =
          await this.groupService.findAllUsersInGroup({id:group_id});
        return { group_users };
      }
    } catch (error) {
      console.log(error);
      throw Error(error);
    }
  }
}
