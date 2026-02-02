import { ErrorResponse } from '@/types/LocalTypes';

const fetchData = async <T>(
  url: string,
  options: RequestInit = {},
): Promise<T> => {
  const response = await fetch(url, options);
  const json = await response.json();
  if (!response.ok) {
    // kokeile joskus: throw response;
    const errorJson = json as unknown as ErrorResponse;
    if (errorJson.message) {
      throw new Error(errorJson.message);
    }
    throw new Error(`Error ${response.status} occured`);
  }
  return json;
};

export default fetchData;
