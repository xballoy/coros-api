import dayjs from 'dayjs';
import { InvalidParameterError } from './invalid-parameter-error';

export const parseDate = (value: string, parameterName: string): Date => {
  const maybeDate = dayjs(value, 'YYYY-MM-DD', true);
  if (!maybeDate.isValid()) {
    throw new InvalidParameterError(parameterName, value, 'Format must be YYYY-MM-DD');
  }

  return maybeDate.toDate();
};
