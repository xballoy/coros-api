import { isAxiosError } from 'axios';

const TOO_MANY_REQUESTS = 429;

export const isRateLimited = (error: unknown): boolean =>
  isAxiosError(error) && error.response?.status === TOO_MANY_REQUESTS;
