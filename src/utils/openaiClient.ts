import OpenAI from 'openai';

let openaiInstance: OpenAI | null = null;

export function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  if (!openaiInstance) {
    openaiInstance = new OpenAI({ apiKey });
  }

  return openaiInstance;
}
