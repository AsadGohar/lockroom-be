import { randomInt } from 'crypto';
import { Twilio } from 'twilio';

const client = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

export const sendSMS = async (phoneNumber: string) => {
  try {
    const otp =  generateOTP()
    const smsResponse = await client.messages.create({
      from: String(process.env.TWILIO_PHONE_NUMBER),
      to: phoneNumber,
      body: `Use this code ${otp}`,
    });
    console.log(smsResponse.sid);
  } catch (error) {
    error.statusCode = 400;
    throw error;
  }
};

export const generateOTP = () => {
  return randomInt(100000, 1000000);
};

