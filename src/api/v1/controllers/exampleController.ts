import { NextFunction, Request, Response } from 'express';
import ExampleModel, { ExampleType } from '../models/exampleModel';
import CustomError from '@/classes/CustomError';
import { MessageResponse } from '@/types/LocalTypes';
import { ExampleCreateBody } from '../schemas/exampleSchemas';

const exampleGet = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.send(await ExampleModel.find());
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const examplePost = async (
  req: Request<{}, {}, ExampleCreateBody>,
  res: Response<MessageResponse & { example: ExampleType }>,
  next: NextFunction,
) => {
  try {
    const newExample = await ExampleModel.create({ title: req.body.title });
    res
      .status(201)
      .send({ message: 'Example created successfully', example: newExample });
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

export { exampleGet, examplePost };
