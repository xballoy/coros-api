import dayjs from 'dayjs';
import { InvalidParameterError } from '../../core/invalid-parameter-error';

export type TrainingStart = {
  hour: number;
  minute: number;
};

export const parseTrainingStart = (value: string): TrainingStart => {
  const parsed = dayjs(value, 'HH:mm', true);
  if (!parsed.isValid()) {
    throw new InvalidParameterError('training-start', value, 'Format must be HH:mm');
  }

  return { hour: parsed.hour(), minute: parsed.minute() };
};
