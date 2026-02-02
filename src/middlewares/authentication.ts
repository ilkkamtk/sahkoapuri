import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import CustomError from '@/classes/CustomError';
import { TokenContent } from '@/types/LocalTypes';
import { getUserById } from '../api/v1/models/userModel';

const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!process.env.JWT_SECRET) {
      next(new CustomError('JWT secret not set', 500));
      return;
    }

    const bearer = req.headers.authorization;
    if (!bearer) {
      next(new CustomError('No token provided', 401));
      return;
    }

    const token = bearer.split(' ')[1];

    if (!token) {
      next(new CustomError('No token provided', 401));
      return;
    }

    const userFromToken = jwt.verify(
      token,
      process.env.JWT_SECRET,
    ) as TokenContent;

    const user = await getUserById(userFromToken.user_id);

    if (!user) {
      next(new CustomError('Token not valid', 403));
      return;
    }

    res.locals.user = user;

    next();
  } catch (error) {
    next(new CustomError((error as Error).message, 400));
  }
};

export { authenticate };
