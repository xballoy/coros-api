type EntityFixture = {
  id: string;
  idInPlan: string;
  planProgramId: string;
  happenDay: string;
  planId: string;
  sportData?: {
    name?: string;
    distance?: number;
    duration?: number;
    happenDay?: string;
  };
};

type ProgramFixture = {
  id: string;
  idInPlan: string;
  name: string;
  overview?: string;
  distance?: number;
  duration?: number;
};

type SubPlanFixture = {
  id: string;
  startDay: number;
  endDay: number;
};

export function buildEntity(overrides: Partial<EntityFixture> = {}): EntityFixture {
  return {
    id: 'entity-1',
    idInPlan: '1',
    planProgramId: '1',
    happenDay: '20260408',
    planId: 'subplan-1',
    ...overrides,
  };
}

export function buildProgram(overrides: Partial<ProgramFixture> = {}): ProgramFixture {
  return {
    id: 'program-1',
    idInPlan: '1',
    name: 'Easy Run',
    overview: '',
    distance: 750000,
    duration: 2700,
    ...overrides,
  };
}

export function buildSubPlan(overrides: Partial<SubPlanFixture> = {}): SubPlanFixture {
  return {
    id: 'subplan-1',
    startDay: 20260407,
    endDay: 20260414,
    ...overrides,
  };
}

export function buildTrainingScheduleResponse({
  entities = [],
  programs = [],
  subPlans = [],
}: {
  entities?: EntityFixture[];
  programs?: ProgramFixture[];
  subPlans?: SubPlanFixture[];
} = {}) {
  return {
    apiCode: '781A35F7',
    message: 'OK',
    result: '0000',
    data: {
      entities,
      programs,
      subPlans,
    },
  };
}

export function buildLocaleMapJs(map: Record<string, string>) {
  return `window.en_US=${JSON.stringify(map)};`;
}
