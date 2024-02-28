import { randomInt } from 'crypto';
import { Twilio } from 'twilio';

const client = new Twilio(
  'AC1d469411ed7fa7883eb5baa21604d6d5',
  '97cd323c36963ccccc26ea2b81f5c63a',
);

export const sendSMS = async (phoneNumber: string) => {
  try {
    console.log(phoneNumber,'number')
    const otp =  generateOTP()
    const smsResponse = await client.messages.create({
      from:'+18145644955',
      to: '+923034697337',
      body: `Use this code ${otp}`,
    });
    console.log('here')
    console.log(smsResponse.sid);
  } catch (error) {
    error.statusCode = 400;
    throw error;
  }
};

export const generateOTP = () => {
  return randomInt(100000, 1000000);
};

