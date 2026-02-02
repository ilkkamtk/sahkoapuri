import mongoose from 'mongoose';
import { User } from '@/types/LocalTypes';

const Schema = mongoose.Schema;

const userSchema = new Schema<User>(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    user_level: { type: String, enum: ['admin', 'user'], default: 'user' },
  },
  { timestamps: true },
);

const UserModel = mongoose.model<User>('User', userSchema);

const getUserById = async (userId: string): Promise<User | null> => {
  return await UserModel.findById(userId);
};

const getUserByUsername = async (username: string): Promise<User | null> => {
  return await UserModel.findOne({ username });
};

export default UserModel;
export { getUserById, getUserByUsername };
