import {
  Controller,
  Post,
  Body,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/email/email.service';
import { GroupsService } from 'src/groups/groups.service';
import { InvitesService } from 'src/invites/invites.service';
import { OrganizationsService } from 'src/organizations/organizations.service';
import { UsersService } from 'src/users/users.service';
import { inviteTemplate } from 'src/utils/email.templates';

@Controller('mail')
export class MailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly inviteService: InvitesService,
    private readonly userService: UsersService,
    private readonly groupService: GroupsService,
    private readonly orgService: OrganizationsService,
    private readonly jwtService: JwtService,
  ) {}

  // @UseGuards(AuthGuard)
  @Post('send-invites')
  async sendEmail(
    @Body('emails') emails: string[],
    @Body('sender_id') sender_id: string,
    @Body('group_id') group_id: string,
    @Body('organization_id') organization_id: string,
  ) {
    try {
      console.log('SEND INVITES TO', emails, 'BY', sender_id);
      if (!sender_id) throw new UnauthorizedException('Sender Id is Missing');
      let new_users = [];
      const senderUser = await this.userService.findOne({ id: sender_id });
      emails.map(async (email: string) => {
        const invitedUserAlreadyExists = await this.userService.findOne({
          email,
        });
        if (invitedUserAlreadyExists) {
          return await this.groupService.addUserToAGroup(
            group_id,
            invitedUserAlreadyExists.id,
          );
        }
        new_users.push(email);
      });

      const { invites } = await this.inviteService.addInvitesBySenderId(
        sender_id,
        new_users,
        group_id,
        organization_id
      );
      
      if (invites.length > 0) {
        const sendEmails = invites.map((invite) => {
          const payload = { invite_id: invite.id };
          console.log('here in x');
          const access_token = this.jwtService.sign(payload, {
            secret: process.env.JWT_INVITE_SECRET,
          });
          const link = `${process.env.FE_HOST}/authentication/signup?confirm=${access_token}`;
          console.log(link,'links')
          const mail = {
            to: invite.sent_to,
            subject: 'Invited to LockRoom',
            from:
              String(process.env.VERIFIED_SENDER_EMAIL) ||
              'waleed@lockroom.com',
            text: 'Hello',
            html: inviteTemplate(senderUser.first_name, link),
          };
          return this.emailService.send(mail);
        });
        const result = await Promise.all(sendEmails);
        if (result.length > 0) {
          return { data: result, message: 'Emails Sent Successfully', invites };
        }
      }
      
    } catch (error) {
      console.log(error);
    }
  }
}
