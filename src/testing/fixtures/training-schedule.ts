type EntityFixture = {
  id: string;
  idInPlan: string;
  planProgramId: string;
  happenDay: string;
  sportData?: {
    name?: string;
    distance?: number;
    duration?: number;
    happenDay?: string;
  };
};

type ProgramFixture = {
  idInPlan: string;
  name: string;
  overview?: string;
  distance?: number;
  duration?: number;
};

export function buildEntity(overrides: Partial<EntityFixture> = {}): EntityFixture {
  return {
    id: 'entity-1',
    idInPlan: '1',
    planProgramId: '1',
    happenDay: '20260408',
    ...overrides,
  };
}

export function buildProgram(overrides: Partial<ProgramFixture> = {}): ProgramFixture {
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
  entities?: EntityFixture[];
  programs?: ProgramFixture[];
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
