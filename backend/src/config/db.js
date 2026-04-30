import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

export const connectDB = async () => {
  await mongoose.connect(env.MONGODB_URI, {
    autoIndex: env.NODE_ENV !== 'production',
  });
  // eslint-disable-next-line no-console
  console.log('MongoDB connected');
};
