import { NextFunction, Request, Response } from 'express';
import UpdateModel from '../models/updateModel';
import CustomError from '@/classes/CustomError';
import { MessageResponse } from '@/types/LocalTypes';
import { PricesQuery, pricesQuerySchema } from '../schemas/pricesSchemas';
import { DateTime } from 'luxon';
import * as fs from 'fs';
import * as path from 'path';
import { loadPricesArray } from '@/utils/priceLoader';

const populatePrices = async (
  req: Request,
  res: Response<MessageResponse>,
  next: NextFunction,
) => {
  try {
    // Check if file has been updated today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const filter = { _id: 'prices-updated-at' };
    const updateDoc = await UpdateModel.findOne(filter);
    const lastUpdated = updateDoc ? new Date(updateDoc.updated) : null;
    lastUpdated?.setHours(0, 0, 0, 0);

    if (!lastUpdated || lastUpdated < today) {
      // Download the Excel file
      const response = await fetch(
        'https://porssisahko.net/api/internal/excel-export',
      );
      if (!response.ok) {
        throw new Error('Failed to download Excel file');
      }
      const buffer = await response.arrayBuffer();

      // Ensure assets directory exists
      const assetsDir = path.join(process.cwd(), 'assets');
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }

      // Save the file
      const filePath = path.join(assetsDir, 'prices.xlsx');
      await fs.promises.writeFile(filePath, Buffer.from(buffer));

      // Update the model
      const filter = { _id: 'prices-updated-at' };
      await UpdateModel.findOneAndUpdate(
        filter,
        { updated: new Date() },
        { upsert: true },
      );
    }

    res.status(200).send({ message: 'Prices file updated successfully' });
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const getPrices = async (
  req: Request<{}, {}, {}, PricesQuery>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const query = pricesQuerySchema.parse(req.query);

    // Normalize query dates to Helsinki timezone for consistent comparison
    const startDate = DateTime.fromISO(query.startDate)
      .setZone('Europe/Helsinki')
      .toJSDate();
    const endDate = DateTime.fromISO(query.endDate)
      .setZone('Europe/Helsinki')
      .toJSDate();

    const filePath = path.join(process.cwd(), 'assets', 'prices.xlsx');
    if (!fs.existsSync(filePath)) {
      next(new CustomError('Prices file not found', 404));
      return;
    }

    // Reuse the price loading utility (already handles Helsinki timezone)
    const allPrices = await loadPricesArray(filePath);

    // Filter by date range
    const prices = allPrices.filter(
      ({ date }) => date >= startDate && date <= endDate,
    );

    res.send(prices);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

export { populatePrices, getPrices };
