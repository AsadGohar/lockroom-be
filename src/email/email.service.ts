import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SendGrid from '@sendgrid/mail';

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {
    SendGrid.setApiKey(this.configService.getOrThrow('SENDGRID_API_KEY'));
  }

  async send(mail: SendGrid.MailDataRequired) {
    try {
      const transport = await SendGrid.send(mail);
      console.log(`E-Mail sent to ${mail.to}`);
      return transport;
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'failed to create user',
      );
    }
  }
}
