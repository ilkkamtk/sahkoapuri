import { NextFunction, Request, Response } from 'express';
import UpdateModel from '../models/updateModel';
import CustomError from '@/classes/CustomError';
import { MessageResponse } from '@/types/LocalTypes';
import {
  PricesPopulateBody,
  PricesQuery,
  pricesQuerySchema,
} from '../schemas/pricesSchemas';
import * as ExcelJS from 'exceljs';
import { DateTime } from 'luxon';
import * as fs from 'fs';
import * as path from 'path';

const populatePrices = async (
  req: Request<{}, {}, PricesPopulateBody>,
  res: Response<MessageResponse>,
  next: NextFunction,
) => {
  try {
    // Check if file has been updated today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const updateDoc = await UpdateModel.findOne();
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
      fs.writeFileSync(filePath, Buffer.from(buffer));

      // Update the model
      await UpdateModel.findOneAndUpdate(
        {},
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

    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    // Read the Excel file
    const filePath = path.join(process.cwd(), 'assets', 'prices.xlsx');
    if (!fs.existsSync(filePath)) {
      next(new CustomError('Prices file not found', 404));
      return;
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];

    const prices: { date: Date; price: number }[] = [];

    // Read from row 5 onwards, A5 time, B5 price
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber >= 5) {
        const timeValue = row.getCell(1).value; // Column A
        const priceValue = row.getCell(2).value; // Column B

        if (timeValue && typeof priceValue === 'number') {
          let date: Date | null = null;
          if (timeValue instanceof Date) {
            date = timeValue;
          } else if (typeof timeValue === 'string') {
            // Try to parse Finnish date format "d.M.yyyy HH:mm"
            let finnishMatch = timeValue.match(
              /^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})$/,
            );
            if (finnishMatch) {
              const [, day, month, year, hour, minute] = finnishMatch;
              date = new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day),
                parseInt(hour),
                parseInt(minute),
              );
            } else {
              // Try alternative format "HH:mm dd.MM.yyyy"
              finnishMatch = timeValue.match(
                /^(\d{1,2}):(\d{2})\s+(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
              );
              if (finnishMatch) {
                const [, hour, minute, day, month, year] = finnishMatch;
                date = new Date(
                  parseInt(year),
                  parseInt(month) - 1,
                  parseInt(day),
                  parseInt(hour),
                  parseInt(minute),
                );
              } else {
                date = new Date(timeValue);
              }
            }
          } else if (typeof timeValue === 'number') {
            // Excel serial date
            date = new Date((timeValue - 25569) * 864e5);
          }

          if (date && !isNaN(date.getTime())) {
            if (date >= startDate && date <= endDate) {
              prices.push({ date, price: priceValue });
            }
          }
        }
      }
    });

    res.send(prices);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

export { populatePrices, getPrices };
