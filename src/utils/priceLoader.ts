import * as path from 'path';
import * as fs from 'fs';
import * as ExcelJS from 'exceljs';
import { DateTime } from 'luxon';

export type PricesMap = Map<string, number[]>;

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

    let dateKey: Date | null = null;
    if (timeValue instanceof Date) {
      dateKey = timeValue;
    } else if (typeof timeValue === 'string') {
      dateKey = new Date(timeValue);
    } else if (typeof timeValue === 'number') {
      dateKey = new Date((timeValue - 25569) * 864e5);
    }
    if (!dateKey || isNaN(dateKey.getTime())) return;

    const helsinkiTime = DateTime.fromJSDate(dateKey).setZone(
      'Europe/Helsinki',
    );
    const key = `${helsinkiTime.year}-${helsinkiTime.month}-${helsinkiTime.day}-${helsinkiTime.hour}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(priceValue);
  });

  return map;
}
