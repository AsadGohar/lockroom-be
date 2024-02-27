import {
  Controller,
  Post,
  Body,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { EmailService } from 'src/email/email.service';
import { GroupsService } from 'src/groups/groups.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { InvitesService } from 'src/invites/invites.service';
import { UsersService } from 'src/users/users.service';
import { inviteTemplate, verificationTemplate } from 'src/utils/email.templates';

@Controller('mail')
export class MailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly inviteService: InvitesService,
    private readonly userService: UsersService,
    private readonly groupService: GroupsService,
  ) {}

  @UseGuards(AuthGuard)
  @Post('send-invites')
  async sendEmail(
    @Body('emails') emails: string[],
    @Body('sender_id') sender_id: string,
    @Body('group_id') group_id: string,
  ) {
    try {
      console.log('SEND INVITES TO',emails, 'BY', sender_id);
      if (!sender_id) throw new UnauthorizedException('Sender Id is Missing');
      const senderUser = await this.userService.findOne({ id: sender_id });
      const sendEmails = emails.map(async (email: string) => {
        const invitedUserAlreadyExists = await this.userService.findOne({
          email,
        });
        if (invitedUserAlreadyExists) {
          return await this.groupService.addUserToAGroup(
            group_id,
            invitedUserAlreadyExists.id,
          );
        }
        const mail = {
          to: email,
          subject: 'Invited to LockRoom',
          from:
            String(process.env.VERIFIED_SENDER_EMAIL) || 'waleed@lockroom.com',
          text: 'Hello',
          html: inviteTemplate(senderUser.full_name),
        };
        return this.emailService.send(mail);
      });
      const result = await Promise.all(sendEmails);
      if (result.length > 0) {
        const invites = await this.inviteService.addInvitesBySenderId(
          sender_id,
          emails,
          group_id
        );
        return { data: result, message: 'Emails Sent Successfully', invites };
      }
    } catch (error) {
      console.log(error);
    }
  }
}
