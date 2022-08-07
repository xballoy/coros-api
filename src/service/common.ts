export const BASE_URL = 'https://teamapi.coros.com';

export type CorosResponse<T> = {
  apiCode: string;
  data: T;
  message: string;
  result: string;
};
