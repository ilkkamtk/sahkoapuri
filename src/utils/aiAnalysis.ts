import OpenAI from 'openai';

export interface AiAnalysis {
  consumption: string | null;
  datetime: string | null;
  interval: '15min' | '1hour';
  dateFormat?:
    | 'd.M.yyyy HH:mm'
    | 'HH:mm dd.MM.yyyy'
    | 'yyyy-MM-dd HH:mm'
    | 'iso'
    | 'excel';
}

export async function inferColumnsWithAI(
  rows: any[],
): Promise<AiAnalysis | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!rows.length || !apiKey) return null;

  const openai = new OpenAI({ apiKey });

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
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful assistant that only outputs a single valid JSON object and nothing else. Do not include any explanations, markdown, or additional text outside the JSON.',
      },
      { role: 'user', content: prompt },
    ],
  });

  const content = completion.choices[0].message.content;
  if (!content) return null;

  try {
    return JSON.parse(content);
  } catch (err) {
    console.error('Failed to parse AI response:', err);
    return { consumption: null, datetime: null, interval: '1hour' };
  }
}
