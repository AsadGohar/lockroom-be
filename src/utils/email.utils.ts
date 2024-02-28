import * as SendGrid from '@sendgrid/mail';

export const sendEmailUtil = async (mail: SendGrid.MailDataRequired) => {
  try {
    const transport = await SendGrid.send(mail);
    console.log(`E-Mail sent to ${mail.to}`);
    return transport;
  } catch (error) {
    console.log(error)
  }
}