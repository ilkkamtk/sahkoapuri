import { ObjectId } from 'mongoose';

type MessageResponse = {
  message: string;
};

type ErrorResponse = MessageResponse & {
  stack?: string;
};

type TokenContent = {
  user_id: string;
};

type User = {
  _id: ObjectId;
  username: string;
  password: string;
  email: string;
  user_level: 'admin' | 'user';
  createdAt: Date | string;
  updatedAt: Date | string;
};

type LoginResponse = {
  message: string;
  token: string;
  user: Omit<User, 'password'>;
};

export type {
  MessageResponse,
  ErrorResponse,
  TokenContent,
  User,
  LoginResponse,
};
