import mongoose from 'mongoose';

const mongoConnect = async () => {
  if (!process.env.MONGO_DB) {
    throw new Error('MONGO_DB is not defined in environment variables');
  }
  try {
    const connection = await mongoose.connect(process.env.MONGO_DB);
    console.log('DB connected successfully');
    return connection;
  } catch (error) {
    console.error('Connection to db failed: ', (error as Error).message);
  }
};

export default mongoConnect;
