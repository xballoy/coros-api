import { existsSync } from 'node:fs';
import { InvalidParameterError } from './invalid-parameter-error';

export const parseOutDir = (out: string): string => {
  if (!existsSync(out)) {
    throw new InvalidParameterError('out', out, 'Directory does not exists');
  }

  return out;
};
