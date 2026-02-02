export type DateFormat =
  | 'd.M.yyyy HH:mm'
  | 'HH:mm dd.MM.yyyy'
  | 'yyyy-MM-dd HH:mm'
  | 'iso'
  | 'excel';

export function parseExcelDate(
  value: unknown,
  format: DateFormat | undefined,
): Date | null {
  if (value instanceof Date) return value;

  if (typeof value === 'number') {
    // Excel serial date
    return new Date((value - 25569) * 864e5);
  }

  if (typeof value !== 'string') return null;

  if (format === 'd.M.yyyy HH:mm') {
    const match = value.match(
      /^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})$/,
    );
    if (!match) return null;
    const [, day, month, year, hour, minute] = match;
    return new Date(+year, +month - 1, +day, +hour, +minute);
  }

  if (format === 'HH:mm dd.MM.yyyy') {
    const match = value.match(
      /^(\d{1,2}):(\d{2})\s+(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
    );
    if (!match) return null;
    const [, hour, minute, day, month, year] = match;
    return new Date(+year, +month - 1, +day, +hour, +minute);
  }

  // default: ISO / yyyy-MM-dd HH:mm / others
  const dt = new Date(value);
  return isNaN(dt.getTime()) ? null : dt;
}
