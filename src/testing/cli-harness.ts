import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { stripVTControlCharacters } from 'node:util';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { runCli } from '../cli.js';
import { COROS_API_BASE_URL, server } from './msw-server.js';

export const TEST_EMAIL = 'runner@example.com';
export const TEST_PASSWORD = 'correct horse battery staple';

export type CliResult = {
  exitCode: number;
  output: string;
};

class ProcessExitError extends Error {
  readonly code: number;

  constructor(code: number) {
    super(`process.exit(${code})`);
    this.code = code;
  }
}

export async function runCorosCli(args: string[]): Promise<CliResult> {
  const chunks: string[] = [];
  const capture = (chunk: unknown) => {
    chunks.push(String(chunk));
    return true;
  };
  const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(capture);
  const stderr = vi.spyOn(process.stderr, 'write').mockImplementation(capture);
  let exitCalledWith: number | undefined;
  const exit = vi.spyOn(process, 'exit').mockImplementation((code) => {
    exitCalledWith = Number(code ?? 0);
    throw new ProcessExitError(exitCalledWith);
  });

  process.exitCode = undefined;
  try {
    await runCli(['node', 'coros-api', ...args]);
  } finally {
    stdout.mockRestore();
    stderr.mockRestore();
    exit.mockRestore();
  }

  const exitCode = exitCalledWith ?? Number(process.exitCode ?? 0);
  process.exitCode = undefined;
  return { exitCode, output: stripVTControlCharacters(chunks.join('')) };
}

export function setupCliTest() {
  const context = {
    outDir: '',
    listFiles: async () => (await readdir(context.outDir)).sort(),
    readOutputFile: (fileName: string) => readFile(path.join(context.outDir, fileName), 'utf-8'),
  };

  beforeAll(() => {
    server.listen({ onUnhandledFrame: 'error' });
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(async () => {
    vi.stubEnv('COROS_API_URL', COROS_API_BASE_URL);
    vi.stubEnv('COROS_EMAIL', TEST_EMAIL);
    vi.stubEnv('COROS_PASSWORD', TEST_PASSWORD);
    context.outDir = await mkdtemp(path.join(tmpdir(), 'coros-cli-'));
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    server.resetHandlers();
    server.events.removeAllListeners();
    await rm(context.outDir, { recursive: true, force: true });
  });

  return context;
}
