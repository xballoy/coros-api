type ActivityFixture = {
  date: number;
  labelId: string;
  name: string | null;
  sportType: number;
};

export function buildActivity(overrides: Partial<ActivityFixture> = {}): ActivityFixture {
  return {
    date: 20250115,
    labelId: 'abc123',
    name: 'Morning Run',
    sportType: 100,
    ...overrides,
  };
}

export function buildQueryActivitiesResponse({
  activities = [buildActivity()],
  pageNumber = 1,
  totalPage = 1,
}: {
  activities?: ActivityFixture[];
  pageNumber?: number;
  totalPage?: number;
} = {}) {
  return {
    apiCode: 'C33BB719',
    message: 'OK',
    result: '0000',
    data: {
      count: activities.length,
      dataList: activities,
      pageNumber,
      totalPage,
    },
  };
}
