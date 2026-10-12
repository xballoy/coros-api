import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runCorosCli, setupCliTest } from '../testing/cli-harness.js';
import {
  fakeCoros,
  RECORDED_ACCESS_TOKEN,
  recordedInvalidCredentialsResponse,
  recordedTrainingSchedule,
} from '../testing/fake-coros.js';

const EXPECTED_FILE = 'training-schedule-2025-03-10-to-2025-03-17.ics';

const ics = (...lines: string[]) => `${lines.join('\r\n')}\r\n`;

const event = (uid: string, ...lines: string[]) => [
  'BEGIN:VEVENT',
  `UID:${uid}`,
  'DTSTAMP:20250310T100000Z',
  ...lines,
  'END:VEVENT',
];

const calendar = (...events: string[][]) =>
  ics(
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//coros-api//training-schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events.flat(),
    'END:VCALENDAR',
  );

describe('coros-api export-training-schedule', () => {
  const env = setupCliTest();

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2025-03-10T10:00:00Z') });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('exports the trainings planned for the next 7 days as an all-day iCalendar file', async () => {
    const { requests } = fakeCoros();

    const { exitCode } = await runCorosCli(['export-training-schedule', '--out', env.outDir]);

    expect(exitCode).toBe(0);
    const [query] = requests.filter((request) => request.url.pathname === '/training/schedule/query');
    expect(Object.fromEntries(query.url.searchParams)).toEqual({
      startDate: '20250310',
      endDate: '20250317',
      supportRestExercise: '1',
    });
    expect(query.headers.get('accessToken')).toBe(RECORDED_ACCESS_TOKEN);
    expect(await env.listFiles()).toEqual([EXPECTED_FILE]);
    expect(await env.readOutputFile(EXPECTED_FILE)).toBe(
      calendar(
        event(
          '900000000000000008',
          'DTSTART;VALUE=DATE:20250311',
          'DTEND;VALUE=DATE:20250312',
          'SUMMARY:Training',
          'DESCRIPTION:0.9 km',
        ),
        event(
          '900000000000000011',
          'DTSTART;VALUE=DATE:20250311',
          'DTEND;VALUE=DATE:20250312',
          'SUMMARY:Training',
          'DESCRIPTION:0.9 km',
        ),
        event(
          '900000000000000013',
          'DTSTART;VALUE=DATE:20250316',
          'DTEND;VALUE=DATE:20250317',
          'SUMMARY:Training',
          'DESCRIPTION:0.9 km',
        ),
      ),
    );
  });

  it('schedules timed events lasting the planned duration with --training-start', async () => {
    fakeCoros();

    const { exitCode } = await runCorosCli([
      'export-training-schedule',
      '--out',
      env.outDir,
      '--training-start',
      '07:30',
    ]);

    expect(exitCode).toBe(0);
    const content = await env.readOutputFile(EXPECTED_FILE);
    expect(content).toContain('DTSTART:20250311T073000\r\nDTEND:20250311T073500\r\n');
    expect(content).toContain('DTSTART:20250316T073000\r\nDTEND:20250316T073500\r\n');
    expect(content).not.toContain('VALUE=DATE');
  });

  it('rejects a malformed --training-start without contacting Coros', async () => {
    const { requests } = fakeCoros();

    const { exitCode, output } = await runCorosCli([
      'export-training-schedule',
      '--out',
      env.outDir,
      '--training-start',
      '7h30',
    ]);

    expect(exitCode).toBe(1);
    expect(output).toContain('Invalid value 7h30 for parameter training-start. Format must be HH:mm');
    expect(requests).toEqual([]);
  });

  it('translates Coros locale keys used as training names and overviews', async () => {
    const schedule = recordedTrainingSchedule();
    const [entity] = schedule.entities;
    const [program] = schedule.programs;
    fakeCoros({
      trainingSchedule: {
        ...schedule,
        entities: [entity],
        programs: [{ ...program, name: 'T1170', overview: 'T3001', distance: 500000 }],
      },
    });

    await runCorosCli(['export-training-schedule', '--out', env.outDir]);

    const content = await env.readOutputFile(EXPECTED_FILE);
    expect(content).toContain('SUMMARY:Jogging\r\n');
    expect(content).toContain('DESCRIPTION:5 km - Training\r\n');
  });

  it('keeps names that are not locale keys as they are', async () => {
    const schedule = recordedTrainingSchedule();
    fakeCoros({
      trainingSchedule: {
        ...schedule,
        entities: [schedule.entities[0]],
        programs: [{ ...schedule.programs[0], name: 'Hill repeats, 6x400m' }],
      },
    });

    await runCorosCli(['export-training-schedule', '--out', env.outDir]);

    expect(await env.readOutputFile(EXPECTED_FILE)).toContain('SUMMARY:Hill repeats\\, 6x400m\r\n');
  });

  it('still exports a training whose program is missing, under a generic name', async () => {
    const schedule = recordedTrainingSchedule();
    fakeCoros({
      trainingSchedule: {
        ...schedule,
        entities: [{ ...schedule.entities[0], idInPlan: '404', planProgramId: '404' }],
        programs: schedule.programs.map((program) => ({ ...program, name: 'Easy Run' })),
      },
    });

    await runCorosCli(['export-training-schedule', '--out', env.outDir]);

    const content = await env.readOutputFile(EXPECTED_FILE);
    expect(content.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(content).toContain('SUMMARY:Training\r\n');
    expect(content).not.toContain('DESCRIPTION');
  });

  it('orders events chronologically and skips trainings without a date', async () => {
    const schedule = recordedTrainingSchedule();
    const [first, second, third] = schedule.entities;
    fakeCoros({
      trainingSchedule: {
        ...schedule,
        entities: [third, { ...second, happenDay: undefined }, first],
      },
    });

    await runCorosCli(['export-training-schedule', '--out', env.outDir]);

    const content = await env.readOutputFile(EXPECTED_FILE);
    expect(content.match(/DTSTART;VALUE=DATE:\d+/g)).toEqual([
      'DTSTART;VALUE=DATE:20250311',
      'DTSTART;VALUE=DATE:20250316',
    ]);
  });

  it('exports an empty calendar when nothing is planned', async () => {
    fakeCoros({ trainingSchedule: { ...recordedTrainingSchedule(), entities: [], programs: [] } });

    const { exitCode } = await runCorosCli(['export-training-schedule', '--out', env.outDir]);

    expect(exitCode).toBe(0);
    expect(await env.readOutputFile(EXPECTED_FILE)).toBe(calendar());
  });

  it('reports the Coros error and writes no file when the credentials are rejected', async () => {
    fakeCoros({ loginResponse: recordedInvalidCredentialsResponse() });

    const { exitCode, output } = await runCorosCli(['export-training-schedule', '--out', env.outDir]);

    expect(exitCode).toBe(1);
    expect(output).toContain('The login credentials you entered do not match our records.');
    expect(await env.listFiles()).toEqual([]);
  });

  it('exports untranslated names with a warning when the Coros translations cannot be downloaded', async () => {
    const schedule = recordedTrainingSchedule();
    fakeCoros({
      localeScript: null,
      trainingSchedule: {
        ...schedule,
        entities: [schedule.entities[0]],
        programs: [{ ...schedule.programs[0], name: 'T1170' }],
      },
    });

    const { exitCode, output } = await runCorosCli(['export-training-schedule', '--out', env.outDir]);

    expect(exitCode).toBe(0);
    expect(output).toContain('WARN [ExportTrainingScheduleCommandRunner] Could not download Coros translations');
    expect(await env.readOutputFile(EXPECTED_FILE)).toContain('SUMMARY:T1170\r\n');
  });

  it('rejects an output directory that does not exist', async () => {
    const { requests } = fakeCoros();
    const missingDir = path.join(env.outDir, 'missing');

    const { exitCode, output } = await runCorosCli(['export-training-schedule', '--out', missingDir]);

    expect(exitCode).toBe(1);
    expect(output).toContain('Directory does not exist');
    expect(requests).toEqual([]);
  });
});
