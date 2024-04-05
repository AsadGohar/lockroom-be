import { randomInt } from 'crypto';
import { Twilio } from 'twilio';

const client = new Twilio(
  'ACdca86537aafcab1394824f747e307cb4',
  '6901a150b80c0167a9982516ed4dc7f4',
);

export const sendSMS = async (phone_number: string, otp: string) => {
  try {
    const smsResponse = await client.messages.create({
      messagingServiceSid: 'MG22d25910963d7e4276229a7c07423124',
      to: phone_number,
      body: `Use this code ${otp}`,
    });
    // console.log(smsResponse)
    return smsResponse;
  } catch (error) {
    error.statusCode = 400;
    throw error;
  }
};

export const generateOTP = () => {
  return randomInt(100000, 1000000);
};
