import * as path from 'path';
import * as fs from 'fs';
import * as ExcelJS from 'exceljs';
import { DateTime } from 'luxon';
import { parseExcelDate } from './dateParser';

export type PricesMap = Map<string, number[]>;
export type PriceEntry = { date: Date; price: number };

type RawPrice = { helsinkiTime: DateTime; price: number };

async function readRawPrices(pricesFilePath?: string): Promise<RawPrice[]> {
  const filePath =
    pricesFilePath ?? path.join(process.cwd(), 'assets', 'prices.xlsx');

  if (!fs.existsSync(filePath)) return [];

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const result: RawPrice[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber < 5) return;

    const timeValue = row.getCell(1).value;
    const priceValue = row.getCell(2).value;
    if (!timeValue || typeof priceValue !== 'number') return;

    const date = parseExcelDate(timeValue);
    if (!date || isNaN(date.getTime())) return;

    const helsinkiTime = DateTime.fromJSDate(date).setZone('Europe/Helsinki');
    result.push({ helsinkiTime, price: priceValue });
  });

  return result;
}

export async function loadPricesMap(
  pricesFilePath?: string,
): Promise<PricesMap> {
  const raw = await readRawPrices(pricesFilePath);
  const map: PricesMap = new Map();

  for (const { helsinkiTime, price } of raw) {
    const key = `${helsinkiTime.year}-${helsinkiTime.month}-${helsinkiTime.day}-${helsinkiTime.hour}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(price);
  }

  return map;
}

export async function loadPricesArray(
  pricesFilePath?: string,
): Promise<PriceEntry[]> {
  const raw = await readRawPrices(pricesFilePath);
  return raw.map(({ helsinkiTime, price }) => ({
    date: helsinkiTime.toJSDate(),
    price,
  }));
}
