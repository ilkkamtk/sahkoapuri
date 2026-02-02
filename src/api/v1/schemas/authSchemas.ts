import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const cryptSchema = z.object({
  password: z.string(),
});

export type LoginBody = z.infer<typeof loginSchema>;
export type CryptBody = z.infer<typeof cryptSchema>;
