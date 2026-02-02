import { z } from 'zod';

export const pricesPopulateSchema = z.object({
  years: z.array(z.number().int().min(2000).max(2100)), // Reasonable year range
});

export type PricesPopulateBody = z.infer<typeof pricesPopulateSchema>;

export const pricesQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
});

export type PricesQuery = z.infer<typeof pricesQuerySchema>;
