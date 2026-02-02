import { z } from 'zod';

export const exampleCreateSchema = z.object({
  title: z.string().min(1),
});

export type ExampleCreateBody = z.infer<typeof exampleCreateSchema>;
