import { Request, Response, NextFunction } from 'express';
import * as ExcelJS from 'exceljs';
import { DateTime } from 'luxon';
import CustomError from '@/classes/CustomError';
import * as fs from 'fs';
import { inferColumnsWithAI } from '@/utils/aiAnalysis';
import { loadPricesMap } from '@/utils/priceLoader';
import { parseExcelDate } from '@/utils/dateParser';

function findColumnIndex(headers: any[], target: string | null): number {
  if (!target) return -1;
  return headers.findIndex((value) => value === target);
}

const upload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      next(new CustomError('No file uploaded', 400));
      return;
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);

    // Get the first worksheet
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      next(new CustomError('No worksheets found in the file', 400));
      return;
    }

    // Get first 5 rows for AI analysis
    const rows: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 5) {
        rows.push(row.values);
      }
    });

    // Analyze with AI
    const aiAnalysis = await inferColumnsWithAI(rows);

    // Early exit if AI couldn't identify required columns
    if (!aiAnalysis || !aiAnalysis.consumption || !aiAnalysis.datetime) {
      return res.json({ aiAnalysis, totalConsumption: 0, averagePrice: 0 });
    }

    // Find column indices based on AI-identified headers
    const headerRow = rows[0] ?? [];
    const consumptionCol = findColumnIndex(headerRow, aiAnalysis.consumption);
    const datetimeCol = findColumnIndex(headerRow, aiAnalysis.datetime);

    if (consumptionCol === -1 || datetimeCol === -1) {
      return res.json({ aiAnalysis, totalConsumption: 0, averagePrice: 0 });
    }

    // Load price data
    const pricesMap = await loadPricesMap();

    // Collect all data rows
    const dataRows: ExcelJS.Row[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        dataRows.push(row);
      }
    });

    // Process each row and accumulate totals
    let totalConsumption = 0;
    let sumPrices = 0;

    for (const row of dataRows) {
      const datetimeValue = row.getCell(datetimeCol).value;
      const consumptionValue = row.getCell(consumptionCol).value;

      if (!datetimeValue || typeof consumptionValue !== 'number') {
        continue;
      }

      // Parse date using helper
      const dateKey = parseExcelDate(datetimeValue, aiAnalysis.dateFormat);
      if (!dateKey) {
        console.warn(
          `Skipping row: invalid datetime format, type: ${typeof datetimeValue}, value: ${datetimeValue}`,
        );
        continue;
      }

      // Convert to Helsinki time and find price
      const helsinkiTime =
        DateTime.fromJSDate(dateKey).setZone('Europe/Helsinki');
      const key = `${helsinkiTime.year}-${helsinkiTime.month}-${helsinkiTime.day}-${helsinkiTime.hour}`;
      const hourlyPrices = pricesMap.get(key);

      if (hourlyPrices && hourlyPrices.length > 0) {
        let priceToUse: number;

        if (aiAnalysis.interval === '15min') {
          // For 15-minute consumption data, use the exact 15-min price slot
          priceToUse = hourlyPrices[Math.floor(helsinkiTime.minute / 15)];
        } else {
          // For hourly consumption data, average all 4 prices in the hour
          priceToUse =
            hourlyPrices.reduce((sum, p) => sum + p, 0) / hourlyPrices.length;
        }

        totalConsumption += consumptionValue;
        sumPrices += priceToUse * consumptionValue;
      }
    }

    // Calculate average cost per kWh: total cost / total consumption
    const averagePrice =
      totalConsumption > 0 ? sumPrices / totalConsumption : 0;

    res.json({ aiAnalysis, totalConsumption, averagePrice });
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  } finally {
    // Always clean up uploaded file
    if (req.file?.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error('Failed to delete uploaded file:', err);
        }
      });
    }
  }
};

export { upload };
