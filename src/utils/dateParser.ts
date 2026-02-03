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

  const trimmed = value.trim();

  // Try Finnish format "d.M.yyyy HH:mm" (e.g., 1.2.2024 09:30)
  if (!format || format === 'd.M.yyyy HH:mm') {
    const match = trimmed.match(
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
    const match = trimmed.match(
      /^(\d{1,2}):(\d{2})\s+(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
    );
    if (match) {
      const [, hour, minute, day, month, year] = match;
      return new Date(+year, +month - 1, +day, +hour, +minute);
    }
    if (format) return null;
  }

  // Try format "yyyy-MM-dd HH:mm" (e.g., 2025-01-01 14:30)
  if (!format || format === 'yyyy-MM-dd HH:mm') {
    const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/.exec(trimmed);
    if (match) {
      const [, yearStr, monthStr, dayStr, hourStr, minuteStr] = match;
      const year = Number(yearStr);
      const month = Number(monthStr) - 1; // JS months are 0-based
      const day = Number(dayStr);
      const hour = Number(hourStr);
      const minute = Number(minuteStr);
      const date = new Date(year, month, day, hour, minute);
      if (!isNaN(date.getTime())) return date;
    }
    if (format) return null;
  }

  // Try ISO 8601 format
  if (!format || format === 'iso') {
    const isoMatch =
      /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(Z|[+\-]\d{2}:?\d{2})?)?$/.test(
        trimmed,
      );
    if (isoMatch) {
      const date = new Date(trimmed);
      if (!isNaN(date.getTime())) return date;
    }
    if (format) return null;
  }

  // Try Excel serial date as string (e.g., "45234" or "45234.5")
  if (!format || format === 'excel') {
    const numeric = Number(trimmed.replace(',', '.'));
    if (Number.isFinite(numeric)) {
      return new Date((numeric - 25569) * 864e5);
    }
    if (format) return null;
  }

  // Fallback for unspecified format
  if (!format) {
    const dt = new Date(trimmed);
    return isNaN(dt.getTime()) ? null : dt;
  }

  return null;
}
