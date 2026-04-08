import type { Activity } from '../../coros/activity/query-activities.request';

export function buildActivity(overrides: Partial<Activity> = {}): Activity {
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
  activities?: Activity[];
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
