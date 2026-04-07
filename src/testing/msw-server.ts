import { setupServer } from 'msw/node';

export const COROS_API_BASE_URL = 'http://coros-api.test';

export const server = setupServer();
