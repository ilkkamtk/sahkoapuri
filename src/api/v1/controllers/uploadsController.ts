import { Request, Response, NextFunction } from 'express';
import * as ExcelJS from 'exceljs';
import OpenAI from 'openai';
import { DateTime } from 'luxon';
import CustomError from '@/classes/CustomError';
import * as fs from 'fs';
import * as path from 'path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

    // Get first 5 rows
    const rows: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 5) {
        rows.push(row.values);
      }
    });

    let aiAnalysis = null;
    if (rows.length > 0 && process.env.OPENAI_API_KEY) {
      const prompt = `Analyze the following data from the first 5 rows of an Excel sheet. Identify the columns for:
1. Hourly electricity consumption (title might be like "Kokonaissiirto (kWh)" or similar).
2. Date and/or time (title might be like "Date", "Time", "Päivämäärä", "Aika", or similar).
3. Time interval: Check if the time values are in 15-minute intervals (e.g., 00:00, 00:15, 00:30, 00:45) or 1-hour intervals (e.g., 00:00, 01:00, 02:00).
4. Date format: Look at the actual datetime values and determine their format. Common formats:
   - "d.M.yyyy HH:mm" (e.g., 1.1.2025 14:30)
   - "HH:mm dd.MM.yyyy" (e.g., 14:30 01.01.2025)
   - "yyyy-MM-dd HH:mm" (e.g., 2025-01-01 14:30)
   - "iso" for ISO 8601 strings (e.g., 2026-02-04T00:00:00.000Z)
   - "excel" for Excel Date objects

Return in JSON format: {"consumption": "Column Title", "datetime": "Column Title", "interval": "15min" or "1hour", "dateFormat": "d.M.yyyy HH:mm" or "HH:mm dd.MM.yyyy" or "yyyy-MM-dd HH:mm" or "iso" or "excel"}.

Data:
${JSON.stringify(rows, null, 2)}

If a column is not found, use null for that field.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
      });

      const aiResponse = completion.choices[0].message.content;
      if (aiResponse) {
        try {
          aiAnalysis = JSON.parse(aiResponse);
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError);
          aiAnalysis = { consumption: null, datetime: null, interval: '1hour' };
        }
      }
    }

    let totalConsumption = 0;
    let sumPrices = 0;
    let count = 0;

    if (aiAnalysis) {
      if (aiAnalysis.consumption && aiAnalysis.datetime) {
        // Find column indices based on titles from header row
        let consumptionCol = -1;
        let datetimeCol = -1;

        if (rows.length > 0 && rows[0]) {
          for (let col = 1; col < rows[0].length; col++) {
            const cellValue = rows[0][col];
            if (cellValue === aiAnalysis.consumption) {
              consumptionCol = col;
            }
            if (cellValue === aiAnalysis.datetime) {
              datetimeCol = col;
            }
          }
        }

        if (consumptionCol !== -1 && datetimeCol !== -1) {
          // Load prices into a map, grouping 15-min intervals by hour
          const pricesMap = new Map<string, number[]>();
          const pricesFilePath = path.join(
            process.cwd(),
            'assets',
            'prices.xlsx',
          );
          if (fs.existsSync(pricesFilePath)) {
            const pricesWorkbook = new ExcelJS.Workbook();
            await pricesWorkbook.xlsx.readFile(pricesFilePath);
            const pricesWorksheet = pricesWorkbook.worksheets[0];
            pricesWorksheet.eachRow((row, rowNumber) => {
              if (rowNumber >= 5) {
                const timeValue = row.getCell(1).value;
                const priceValue = row.getCell(2).value;
                if (timeValue && typeof priceValue === 'number') {
                  let dateKey: Date | null = null;
                  if (timeValue instanceof Date) {
                    dateKey = timeValue;
                  } else if (typeof timeValue === 'string') {
                    dateKey = new Date(timeValue);
                  } else if (typeof timeValue === 'number') {
                    // Excel serial date
                    dateKey = new Date((timeValue - 25569) * 864e5);
                  }
                  if (dateKey && !isNaN(dateKey.getTime())) {
                    // Convert to Helsinki time and create key from year-month-day-hour
                    const helsinkiTime =
                      DateTime.fromJSDate(dateKey).setZone('Europe/Helsinki');
                    const key = `${helsinkiTime.year}-${helsinkiTime.month}-${helsinkiTime.day}-${helsinkiTime.hour}`;
                    if (!pricesMap.has(key)) {
                      pricesMap.set(key, []);
                    }
                    pricesMap.get(key)!.push(priceValue);
                  }
                }
              }
            });
          }

          // Collect all data rows
          const dataRows: ExcelJS.Row[] = [];
          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
              dataRows.push(row);
            }
          });

          // Process each row
          for (const row of dataRows) {
            const datetimeValue = row.getCell(datetimeCol).value;
            const consumptionValue = row.getCell(consumptionCol).value;

            if (
              datetimeValue &&
              consumptionValue &&
              typeof consumptionValue === 'number'
            ) {
              let dateKey: Date | null = null;
              if (datetimeValue instanceof Date) {
                dateKey = datetimeValue;
              } else if (typeof datetimeValue === 'string') {
                // Parse based on AI-detected format
                if (aiAnalysis.dateFormat === 'd.M.yyyy HH:mm') {
                  const match = datetimeValue.match(
                    /^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})$/,
                  );
                  if (match) {
                    const [, day, month, year, hour, minute] = match;
                    dateKey = new Date(
                      parseInt(year),
                      parseInt(month) - 1,
                      parseInt(day),
                      parseInt(hour),
                      parseInt(minute),
                    );
                  }
                } else if (aiAnalysis.dateFormat === 'HH:mm dd.MM.yyyy') {
                  const match = datetimeValue.match(
                    /^(\d{1,2}):(\d{2})\s+(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
                  );
                  if (match) {
                    const [, hour, minute, day, month, year] = match;
                    dateKey = new Date(
                      parseInt(year),
                      parseInt(month) - 1,
                      parseInt(day),
                      parseInt(hour),
                      parseInt(minute),
                    );
                  }
                } else {
                  // Default fallback for yyyy-MM-dd HH:mm or other ISO formats
                  dateKey = new Date(datetimeValue);
                }
              } else if (typeof datetimeValue === 'number') {
                // Excel serial date
                dateKey = new Date((datetimeValue - 25569) * 864e5);
              } else {
                console.warn(
                  `Skipping row: invalid datetime format, type: ${typeof datetimeValue}, value: ${datetimeValue}`,
                );
                continue;
              }

              if (!dateKey || isNaN(dateKey.getTime())) {
                console.warn(`Skipping row: invalid datetime`);
                continue;
              }

              // Convert to Helsinki time and find price based on detected interval
              const helsinkiTime =
                DateTime.fromJSDate(dateKey).setZone('Europe/Helsinki');
              const key = `${helsinkiTime.year}-${helsinkiTime.month}-${helsinkiTime.day}-${helsinkiTime.hour}`;
              const hourlyPrices = pricesMap.get(key);

              if (hourlyPrices && hourlyPrices.length > 0) {
                let priceToUse: number;

                if (aiAnalysis.interval === '15min') {
                  // For 15-minute intervals, find exact matching price by minute
                  const minuteIndex = Math.floor(dateKey.getMinutes() / 15);
                  priceToUse = hourlyPrices[minuteIndex] || hourlyPrices[0];
                } else {
                  // For hourly intervals, use average of all 4 fifteen-minute prices
                  priceToUse =
                    hourlyPrices.reduce((sum, p) => sum + p, 0) /
                    hourlyPrices.length;
                }
                totalConsumption += consumptionValue;
                sumPrices += priceToUse * consumptionValue;
                count++;
              }
            }
          }

          // Calculate average cost per kWh: total cost / total consumption
          const averagePrice =
            totalConsumption > 0 ? sumPrices / totalConsumption : 0;

          res.json({ aiAnalysis, totalConsumption, averagePrice });
        }
      }
    } else {
      res.json({ totalConsumption: 0, averagePrice: 0, aiAnalysis: null });
    }

    // Clean up uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error('Failed to delete uploaded file:', err);
      }
    });
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};
export { upload };
