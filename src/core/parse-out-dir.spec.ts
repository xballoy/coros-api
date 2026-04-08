import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { InvalidParameterError } from './invalid-parameter-error';
import { parseOutDir } from './parse-out-dir';

describe('parseOutDir', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(tmpdir(), 'parse-out-dir-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('returns the path when the directory exists', () => {
    expect(parseOutDir(tmpDir)).toBe(tmpDir);
  });

  it('throws InvalidParameterError when the directory does not exist', () => {
    const nonExistent = path.join(tmpDir, 'does-not-exist');
    expect(() => parseOutDir(nonExistent)).toThrow(InvalidParameterError);
  });
});
