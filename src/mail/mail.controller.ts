import { Controller, Post, Body } from '@nestjs/common';
import { EmailService } from 'src/email/email.service';
import { inviteTemplate } from 'src/utils/email.templates';


@Controller('mail')
export class MailController {
  constructor(private readonly emailService: EmailService) {}
  @Post('send-invites')
  async sendEmail(@Body('emails') emails: String[]) {
    try {
      console.log(emails)
      const sendEmails = emails.map((email:string) => {
        const mail = {
          to: email,
          subject: 'Hello from LockRoom',
          from:
            String(process.env.VERIFIED_SENDER_EMAIL) || 'waleed@lockroom.com',
          text: 'Hello',
          html: inviteTemplate('Fayiz'),
        };
        return this.emailService.send(mail);
      });
      const result = await Promise.all(sendEmails)
      if(result.length>0){
        return { data: result, message:'Emails Sent Successfully'}
      }
    } catch (error) {
      console.log(error)
    }
  }
}
