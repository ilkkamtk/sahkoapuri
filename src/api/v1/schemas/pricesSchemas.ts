import { z } from 'zod';

export const pricesQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
});

export type PricesQuery = z.infer<typeof pricesQuerySchema>;
