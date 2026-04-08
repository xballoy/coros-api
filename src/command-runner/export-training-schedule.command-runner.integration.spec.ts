import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Test } from '@nestjs/testing';
import { HttpResponse, http } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../app.module';
import { buildLoginResponse } from '../testing/fixtures/login';
import {
  buildEntity,
  buildLocaleMapJs,
  buildProgram,
  buildTrainingScheduleResponse,
} from '../testing/fixtures/training-schedule';
import { COROS_API_BASE_URL, server } from '../testing/msw-server';
import { ExportTrainingScheduleCommandRunner } from './export-training-schedule.command-runner';

const LOCALE_MAP = {
  'training.easy_run': 'Easy Run',
  'training.tempo': 'Tempo Run',
  S4734: 'Runna Training Plan',
};

function loginHandler() {
  return http.post(`${COROS_API_BASE_URL}/account/login`, () => {
    return HttpResponse.json(buildLoginResponse());
  });
}

function localeMapHandler(map: Record<string, string> = LOCALE_MAP) {
  return http.get('https://static.coros.com/locale/coros-traininghub-v2/en-US.prod.js', () => {
    return new HttpResponse(buildLocaleMapJs(map), {
      headers: { 'Content-Type': 'application/javascript' },
    });
  });
}

describe('export-training-schedule', () => {
  let tmpDir: string;
  const originalEnv = { ...process.env };

  beforeAll(() => {
    process.env.COROS_API_URL = COROS_API_BASE_URL;
    process.env.COROS_EMAIL = 'test@example.com';
    process.env.COROS_PASSWORD = 'testpassword';
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterAll(() => {
    server.close();
    process.env = originalEnv;
  });

  beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-04-07T10:00:00Z'));
    tmpDir = await mkdtemp(path.join(tmpdir(), 'coros-test-'));
  });

  afterEach(async () => {
    vi.useRealTimers();
    server.resetHandlers();
    await rm(tmpDir, { recursive: true, force: true });
  });

  async function runCommand(flags: Record<string, unknown> = {}) {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    const runner = moduleRef.get(ExportTrainingScheduleCommandRunner);
    await runner.run([], { outDir: tmpDir, ...flags });

    await moduleRef.close();
  }

  it('exports ICS with correct filename and calendar structure', async () => {
    const entity1 = buildEntity({ id: 'e1', idInPlan: '1', planProgramId: '1', happenDay: '20260408' });
    const entity2 = buildEntity({ id: 'e2', idInPlan: '2', planProgramId: '2', happenDay: '20260410' });
    const program1 = buildProgram({ idInPlan: '1', name: 'Easy Run', distance: 750000, duration: 2700 });
    const program2 = buildProgram({
      idInPlan: '2',
      name: 'Tempo Run',
      overview: 'Tempo workout',
      distance: 1000000,
      duration: 3600,
    });

    server.use(
      loginHandler(),
      http.get(`${COROS_API_BASE_URL}/training/schedule/query`, () => {
        return HttpResponse.json(
          buildTrainingScheduleResponse({
            entities: [entity1, entity2],
            programs: [program1, program2],
          }),
        );
      }),
      localeMapHandler(),
    );

    await runCommand();

    const files = await readdir(tmpDir);
    expect(files).toHaveLength(1);
    expect(files[0]).toBe('training-schedule-2026-04-07-to-2026-04-14.ics');

    const content = await readFile(path.join(tmpDir, files[0]), 'utf-8');
    expect(content).toContain('BEGIN:VCALENDAR');
    expect(content).toContain('VERSION:2.0');
    expect(content).toContain('PRODID:-//coros-api//training-schedule//EN');
    expect(content).toContain('END:VCALENDAR');

    const eventCount = (content.match(/BEGIN:VEVENT/g) ?? []).length;
    expect(eventCount).toBe(2);

    expect(content).toContain('SUMMARY:Easy Run');
    expect(content).toContain('SUMMARY:Tempo Run');
    expect(content).toContain('DTSTART;VALUE=DATE:20260408');
    expect(content).toContain('DTSTART;VALUE=DATE:20260410');
  });

  it('creates timed events with --training-start flag', async () => {
    const entity = buildEntity({ id: 'e1', idInPlan: '1', planProgramId: '1', happenDay: '20260408' });
    const program = buildProgram({ idInPlan: '1', name: 'Easy Run', duration: 2700 });

    server.use(
      loginHandler(),
      http.get(`${COROS_API_BASE_URL}/training/schedule/query`, () => {
        return HttpResponse.json(buildTrainingScheduleResponse({ entities: [entity], programs: [program] }));
      }),
      localeMapHandler(),
    );

    await runCommand({ trainingStart: { hour: 7, minute: 30 } });

    const files = await readdir(tmpDir);
    const content = await readFile(path.join(tmpDir, files[0]), 'utf-8');

    expect(content).toContain('DTSTART:20260408T073000');
    // 2700 seconds = 45 minutes -> 07:30 + 00:45 = 08:15
    expect(content).toContain('DTEND:20260408T081500');
    expect(content).not.toContain('DTSTART;VALUE=DATE:');
  });

  it('produces ICS with no events when schedule is empty', async () => {
    server.use(
      loginHandler(),
      http.get(`${COROS_API_BASE_URL}/training/schedule/query`, () => {
        return HttpResponse.json(buildTrainingScheduleResponse());
      }),
      localeMapHandler(),
    );

    await runCommand();

    const files = await readdir(tmpDir);
    expect(files).toHaveLength(1);

    const content = await readFile(path.join(tmpDir, files[0]), 'utf-8');
    expect(content).toContain('BEGIN:VCALENDAR');
    expect(content).toContain('END:VCALENDAR');
    expect(content).not.toContain('BEGIN:VEVENT');
  });

  it('resolves locale map keys to translated names', async () => {
    const entity = buildEntity({ id: 'e1', idInPlan: '1', planProgramId: '1', happenDay: '20260409' });
    const program = buildProgram({ idInPlan: '1', name: 'S4734' });

    server.use(
      loginHandler(),
      http.get(`${COROS_API_BASE_URL}/training/schedule/query`, () => {
        return HttpResponse.json(buildTrainingScheduleResponse({ entities: [entity], programs: [program] }));
      }),
      localeMapHandler(),
    );

    await runCommand();

    const files = await readdir(tmpDir);
    const content = await readFile(path.join(tmpDir, files[0]), 'utf-8');

    expect(content).toContain('SUMMARY:Runna Training Plan');
    expect(content).not.toContain('SUMMARY:S4734');
  });
});
