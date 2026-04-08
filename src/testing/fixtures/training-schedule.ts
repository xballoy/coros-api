import type {
  TrainingScheduleEntity,
  TrainingScheduleProgram,
} from '../../coros/training-schedule/query-training-schedule.request';

export function buildEntity(overrides: Partial<TrainingScheduleEntity> = {}): TrainingScheduleEntity {
  return {
    id: 'entity-1',
    idInPlan: '1',
    planProgramId: '1',
    happenDay: '20260408',
    ...overrides,
  };
}

export function buildProgram(overrides: Partial<TrainingScheduleProgram> = {}): TrainingScheduleProgram {
  return {
    idInPlan: '1',
    name: 'Easy Run',
    overview: '',
    distance: 750000,
    duration: 2700,
    ...overrides,
  };
}

export function buildTrainingScheduleResponse({
  entities = [],
  programs = [],
}: {
  entities?: TrainingScheduleEntity[];
  programs?: TrainingScheduleProgram[];
} = {}) {
  return {
    apiCode: '781A35F7',
    message: 'OK',
    result: '0000',
    data: {
      entities,
      programs,
    },
  };
}

export function buildLocaleMapJs(map: Record<string, string>) {
  return `window.en_US=${JSON.stringify(map)};`;
}
