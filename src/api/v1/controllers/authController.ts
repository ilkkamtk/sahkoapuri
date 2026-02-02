import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import CustomError from '@/classes/CustomError';
import { LoginResponse, User, TokenContent } from '@/types/LocalTypes';
import { getUserByUsername } from '../models/userModel';
import { LoginBody, CryptBody } from '../schemas/authSchemas';

const login = async (
  req: Request<{}, {}, LoginBody>,
  res: Response<LoginResponse>,
  next: NextFunction,
) => {
  try {
    const { username, password } = req.body;
    const user = await getUserByUsername(username);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      next(new CustomError('Incorrect username/password', 403));
      return;
    }

    if (!process.env.JWT_SECRET) {
      next(new CustomError('JWT secret not set', 500));
      return;
    }

    delete (user as { password?: string }).password;

    const tokenContent: TokenContent = {
      user_id: user._id.toString(),
    };

    const token = jwt.sign(tokenContent, process.env.JWT_SECRET);

    res.json({
      message: 'Login successful',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

const crypt = async (
  req: Request<{}, {}, CryptBody>,
  res: Response<{ hashedPassword: string }>,
  next: NextFunction,
) => {
  try {
    const { password } = req.body;
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    res.json({ hashedPassword });
  } catch (error) {
    next(error);
  }
};

export { login, crypt };
