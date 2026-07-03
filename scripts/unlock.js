import dotenv from 'dotenv';
dotenv.config();
import connectDB from '../config/db.js';
import User from '../models/User.js';

const unlock = async () => {
  try {
    await connectDB();
    const result = await User.updateMany(
      {},
      { failedLoginAttempts: 0, accountLockedUntil: null }
    );
    console.log(`🔑 Successfully unlocked all accounts! Reset ${result.modifiedCount} user(s).`);
    process.exit(0);
  } catch (error) {
    console.error('Error unlocking accounts:', error);
    process.exit(1);
  }
};

unlock();
