import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomInt } from 'crypto';
import { Twilio } from 'twilio';

@Injectable()
export class OTPService {
  private readonly client = new Twilio(
    this.configService.getOrThrow('TWILIO_ACCOUNT_SID'),
    this.configService.getOrThrow('TWILIO_AUTH_TOKEN'),
  );

  constructor(private readonly configService: ConfigService) {}

  async sendSMSService(phone_number: string, otp: string) {
    try {
      const smsResponse = await this.client.messages.create({
        messagingServiceSid: this.configService.getOrThrow('TWILIO_MESSAGING_SID'),
        to: phone_number,
        body: `Use this code ${otp}`,
      });
      console.log(smsResponse);
      return smsResponse;
    } catch (error) {
      error.statusCode = 400;
      throw error;
    }
  }

  generateOTP() {
    return randomInt(100000, 1000000);
  }
}
