import * as path from 'path';
import * as fs from 'fs';
import * as ExcelJS from 'exceljs';
import { DateTime } from 'luxon';
import { parseExcelDate } from './dateParser';

export type PricesMap = Map<string, number[]>;
export type PriceEntry = { date: Date; price: number };

export async function loadPricesMap(
  pricesFilePath?: string,
): Promise<PricesMap> {
  const map: PricesMap = new Map();
  const filePath =
    pricesFilePath ?? path.join(process.cwd(), 'assets', 'prices.xlsx');

  if (!fs.existsSync(filePath)) return map;

  const pricesWorkbook = new ExcelJS.Workbook();
  await pricesWorkbook.xlsx.readFile(filePath);
  const pricesWorksheet = pricesWorkbook.worksheets[0];
  if (!pricesWorksheet) return map;

  pricesWorksheet.eachRow((row, rowNumber) => {
    if (rowNumber < 5) return;

    const timeValue = row.getCell(1).value;
    const priceValue = row.getCell(2).value;
    if (!timeValue || typeof priceValue !== 'number') return;

    const dateKey = parseExcelDate(timeValue);
    if (!dateKey || isNaN(dateKey.getTime())) return;

    const helsinkiTime =
      DateTime.fromJSDate(dateKey).setZone('Europe/Helsinki');
    const key = `${helsinkiTime.year}-${helsinkiTime.month}-${helsinkiTime.day}-${helsinkiTime.hour}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(priceValue);
  });

  return map;
}

export async function loadPricesArray(
  pricesFilePath?: string,
): Promise<PriceEntry[]> {
  const prices: PriceEntry[] = [];
  const filePath =
    pricesFilePath ?? path.join(process.cwd(), 'assets', 'prices.xlsx');

  if (!fs.existsSync(filePath)) return prices;

  const pricesWorkbook = new ExcelJS.Workbook();
  await pricesWorkbook.xlsx.readFile(filePath);
  const pricesWorksheet = pricesWorkbook.worksheets[0];
  if (!pricesWorksheet) return prices;

  pricesWorksheet.eachRow((row, rowNumber) => {
    if (rowNumber < 5) return;

    const timeValue = row.getCell(1).value;
    const priceValue = row.getCell(2).value;
    if (!timeValue || typeof priceValue !== 'number') return;

    const date = parseExcelDate(timeValue);
    if (!date || isNaN(date.getTime())) return;

    // Convert to Helsinki timezone for consistency
    const helsinkiTime = DateTime.fromJSDate(date).setZone('Europe/Helsinki');
    prices.push({ date: helsinkiTime.toJSDate(), price: priceValue });
  });

  return prices;
}
