import type { RequestHandler } from 'express';
import { ZodError, type ZodType } from 'zod';
import CustomError from '@/classes/CustomError';

const formatZodError = (error: ZodError): string => {
  const issueMessages = error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'value';
    return `${path}: ${issue.message}`;
  });

  if (issueMessages.length === 0) {
    return 'Validation error';
  }

  return `Validation error: ${issueMessages.join(', ')}`;
};

export const validateBody = <Output, Input>(
  schema: ZodType<Output, Input>,
): RequestHandler => {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(new CustomError(formatZodError(result.error), 400));
    }

    req.body = result.data as unknown;
    return next();
  };
};

export const validateQuery = <Output, Input>(
  schema: ZodType<Output, Input>,
): RequestHandler => {
  return (req, _res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(new CustomError(formatZodError(result.error), 400));
    }

    req.query = result.data as unknown as typeof req.query;
    return next();
  };
};

export const validateParams = <Output, Input>(
  schema: ZodType<Output, Input>,
): RequestHandler => {
  return (req, _res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return next(new CustomError(formatZodError(result.error), 400));
    }

    req.params = result.data as unknown as typeof req.params;
    return next();
  };
};
