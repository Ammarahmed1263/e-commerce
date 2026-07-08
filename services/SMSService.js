import twilio from 'twilio';

export const sendSMS = async (phoneNumber, message) => {
  try {
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    // await client.messages.create({
    //   body: message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phoneNumber
    // });


    console.log(`\n--- [SMS GATEWAY] ---`);
    console.log(`To: ${phoneNumber}`);
    console.log(`Message: ${message}`);
    console.log(`---------------------\n`);
    
    return true;
  } catch (error) {
    // console.error('SMS Service Error:', error);
    throw new Error('SMS Service Error');
  }
};