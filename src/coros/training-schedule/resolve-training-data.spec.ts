import { describe, expect, it } from 'vitest';
import type { TrainingScheduleEntity, TrainingScheduleProgram } from './query-training-schedule.request';
import {
  formatPlannedLength,
  resolveDurationSeconds,
  resolveOverview,
  resolvePlannedDate,
  resolveSummary,
} from './resolve-training-data';

const makeEntity = (overrides: Partial<TrainingScheduleEntity> = {}): TrainingScheduleEntity => ({
  id: 'e1',
  idInPlan: '1',
  planProgramId: '1',
  happenDay: '20260408',
  ...overrides,
});

const makeProgram = (overrides: Partial<TrainingScheduleProgram> = {}): TrainingScheduleProgram => ({
  idInPlan: '1',
  name: 'Easy Run',
  ...overrides,
});

describe('resolveSummary', () => {
  it('returns locale-mapped program name when available', () => {
    const localeMap = { 'training.easy': 'Easy Run' };
    const program = makeProgram({ name: 'training.easy' });
    expect(resolveSummary(makeEntity(), program, localeMap)).toBe('Easy Run');
  });

  it('returns raw program name when not in locale map', () => {
    const program = makeProgram({ name: 'Unknown Key' });
    expect(resolveSummary(makeEntity(), program, {})).toBe('Unknown Key');
  });

  it('falls back to sportData.name when no program', () => {
    const entity = makeEntity({ sportData: { name: 'Morning Jog' } });
    expect(resolveSummary(entity, undefined, {})).toBe('Morning Jog');
  });

  it('returns "Training" when no program and no sportData name', () => {
    expect(resolveSummary(makeEntity(), undefined, {})).toBe('Training');
  });
});

describe('resolveOverview', () => {
  it('returns locale-mapped overview when available', () => {
    const localeMap = { overview_key: 'Tempo workout description' };
    const program = makeProgram({ overview: 'overview_key' });
    expect(resolveOverview(program, localeMap)).toBe('Tempo workout description');
  });

  it('returns raw overview when not in locale map', () => {
    const program = makeProgram({ overview: 'raw overview' });
    expect(resolveOverview(program, {})).toBe('raw overview');
  });

  it('returns empty string when no overview', () => {
    const program = makeProgram({ overview: undefined });
    expect(resolveOverview(program, {})).toBe('');
  });

  it('returns empty string when no program', () => {
    expect(resolveOverview(undefined, {})).toBe('');
  });
});

describe('formatPlannedLength', () => {
  it('returns formatted distance from program when available', () => {
    const program = makeProgram({ distance: 750000, duration: 2700 });
    expect(formatPlannedLength(program, makeEntity())).toBe('7.5 km');
  });

  it('falls back to entity sportData distance', () => {
    const entity = makeEntity({ sportData: { distance: 1000000 } });
    expect(formatPlannedLength(undefined, entity)).toBe('10 km');
  });

  it('returns formatted duration when no distance', () => {
    const program = makeProgram({ distance: undefined, duration: 2700 });
    expect(formatPlannedLength(program, makeEntity())).toBe('45m');
  });

  it('falls back to entity sportData duration', () => {
    const entity = makeEntity({ sportData: { duration: 3600 } });
    expect(formatPlannedLength(undefined, entity)).toBe('1h 0m');
  });

  it('returns empty string when no distance or duration', () => {
    expect(formatPlannedLength(undefined, makeEntity())).toBe('');
  });

  it('ignores zero distance and falls through to duration', () => {
    const program = makeProgram({ distance: 0, duration: 1800 });
    expect(formatPlannedLength(program, makeEntity())).toBe('30m');
  });
});

describe('resolveDurationSeconds', () => {
  it('returns program duration when available and > 0', () => {
    const program = makeProgram({ duration: 2700 });
    expect(resolveDurationSeconds(program, makeEntity())).toBe(2700);
  });

  it('falls back to entity sportData duration', () => {
    const entity = makeEntity({ sportData: { duration: 1800 } });
    expect(resolveDurationSeconds(undefined, entity)).toBe(1800);
  });

  it('returns undefined when no duration available', () => {
    expect(resolveDurationSeconds(undefined, makeEntity())).toBeUndefined();
  });

  it('ignores zero program duration and falls back to entity', () => {
    const program = makeProgram({ duration: 0 });
    const entity = makeEntity({ sportData: { duration: 900 } });
    expect(resolveDurationSeconds(program, entity)).toBe(900);
  });
});

describe('resolvePlannedDate', () => {
  it('parses happenDay from entity', () => {
    const entity = makeEntity({ happenDay: '20260410' });
    const result = resolvePlannedDate(entity);
    expect(result?.format('YYYY-MM-DD')).toBe('2026-04-10');
  });

  it('falls back to sportData.happenDay when entity happenDay is nullish', () => {
    const entity = makeEntity({ happenDay: undefined as unknown as string, sportData: { happenDay: '20260411' } });
    const result = resolvePlannedDate(entity);
    expect(result?.format('YYYY-MM-DD')).toBe('2026-04-11');
  });

  it('returns null for invalid happenDay', () => {
    const entity = makeEntity({ happenDay: 'invalid' });
    expect(resolvePlannedDate(entity)).toBeNull();
  });

  it('returns null when no happenDay anywhere', () => {
    const entity = makeEntity({ happenDay: '', sportData: { happenDay: '' } });
    expect(resolvePlannedDate(entity)).toBeNull();
  });
});
