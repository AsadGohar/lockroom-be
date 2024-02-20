import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { EmailService } from 'src/email/email.service';
// import { AuthGuard } from 'src/guards/auth.guard';
import { InvitesService } from 'src/invites/invites.service';
import { UsersService } from 'src/users/users.service';
import { inviteTemplate } from 'src/utils/email.templates';

@Controller('mail')
export class MailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly inviteService: InvitesService,
    private readonly userService: UsersService,
  ) {}

  // @UseGuards(AuthGuard)
  @Post('send-invites')
  async sendEmail(
    @Body('emails') emails: string[],
    @Body('sender_id') sender_id: string,
  ) {
    try {
      console.log(emails);
      const findUser = await this.userService.findOne({ id: sender_id });
      const sendEmails = emails.map((email: string) => {
        const mail = {
          to: email,
          subject: 'Invited to LockRoom',
          from:
            String(process.env.VERIFIED_SENDER_EMAIL) || 'waleed@lockroom.com',
          text: 'Hello',
          html: inviteTemplate('Fayiz'),
        };
        return this.emailService.send(mail);
      });
      const result = await Promise.all(sendEmails);
      if (result.length > 0) {
        const invites = await this.inviteService.addInvitesBySenderId(sender_id, emails);
        return { data: result, message: 'Emails Sent Successfully', invites };
      }
    } catch (error) {
      console.log(error);
    }
  }
}
