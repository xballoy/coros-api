import { statSync } from 'node:fs';
import { InvalidParameterError } from './invalid-parameter-error';

export const parseOutDir = (out: string): string => {
  const stats = statSync(out, { throwIfNoEntry: false });
  if (!stats?.isDirectory()) {
    throw new InvalidParameterError('out', out, 'Directory does not exist');
  }

  return out;
};
