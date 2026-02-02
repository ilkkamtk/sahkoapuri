export type DateFormat =
  | 'd.M.yyyy HH:mm'
  | 'HH:mm dd.MM.yyyy'
  | 'yyyy-MM-dd HH:mm'
  | 'iso'
  | 'excel';

export function parseExcelDate(
  value: unknown,
  format?: DateFormat,
): Date | null {
  if (value instanceof Date) return value;

  if (typeof value === 'number') {
    // Excel serial date
    return new Date((value - 25569) * 864e5);
  }

  if (typeof value !== 'string') return null;

  // Try Finnish format "d.M.yyyy HH:mm" (e.g., 1.2.2024 09:30)
  if (!format || format === 'd.M.yyyy HH:mm') {
    const match = value.match(
      /^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})$/,
    );
    if (match) {
      const [, day, month, year, hour, minute] = match;
      return new Date(+year, +month - 1, +day, +hour, +minute);
    }
    if (format) return null;
  }

  // Try Finnish format "HH:mm dd.MM.yyyy" (e.g., 14:30 01.01.2025)
  if (!format || format === 'HH:mm dd.MM.yyyy') {
    const match = value.match(
      /^(\d{1,2}):(\d{2})\s+(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
    );
    if (match) {
      const [, hour, minute, day, month, year] = match;
      return new Date(+year, +month - 1, +day, +hour, +minute);
    }
    if (format) return null;
  }

  // default: ISO / yyyy-MM-dd HH:mm / others
  const dt = new Date(value);
  return isNaN(dt.getTime()) ? null : dt;
}
