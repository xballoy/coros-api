type SportTypeKey =
  | 'all'
  | 'run'
  | 'indoorRun'
  | 'trailRun'
  | 'trackRun'
  | 'hike'
  | 'mtnClimb'
  | 'bike'
  | 'indoorBike'
  | 'roadEbike'
  | 'gravelRoadBike'
  | 'mountainRiding'
  | 'mountainEbike'
  | 'helmetBike'
  | 'poolSwim'
  | 'openWater'
  | 'triathlon'
  | 'strength'
  | 'gymCardio'
  | 'gpsCardio'
  | 'ski'
  | 'snowboard'
  | 'xcSki'
  | 'skiTouring'
  | 'skiTouringOld'
  | 'multiSport'
  | 'speedsurfing'
  | 'windsurfing'
  | 'row'
  | 'indoorRow'
  | 'whitewater'
  | 'flatwater'
  | 'multiPitch'
  | 'climb'
  | 'indoorClimb'
  | 'bouldering'
  | 'walk'
  | 'jumpRope'
  | 'climbStairs'
  | 'customSport';

const AllSportTypes: {
  [T in SportTypeKey]: { key: T; value: string };
} = {
  all: { key: 'all', value: '0' },
  run: { key: 'run', value: '100' },
  indoorRun: { key: 'indoorRun', value: '101' },
  trailRun: { key: 'trailRun', value: '102' },
  trackRun: { key: 'trackRun', value: '103' },
  hike: { key: 'hike', value: '104' },
  mtnClimb: { key: 'mtnClimb', value: '105' },
  bike: { key: 'bike', value: '200' },
  indoorBike: { key: 'indoorBike', value: '201' },
  roadEbike: { key: 'roadEbike', value: '202' },
  gravelRoadBike: { key: 'gravelRoadBike', value: '203' },
  mountainRiding: { key: 'mountainRiding', value: '204' },
  mountainEbike: { key: 'mountainEbike', value: '205' },
  helmetBike: { key: 'helmetBike', value: '299' },
  poolSwim: { key: 'poolSwim', value: '300' },
  openWater: { key: 'openWater', value: '301' },
  triathlon: { key: 'triathlon', value: '10000' },
  strength: { key: 'strength', value: '402' },
  gymCardio: { key: 'gymCardio', value: '400' },
  gpsCardio: { key: 'gpsCardio', value: '401' },
  ski: { key: 'ski', value: '500' },
  snowboard: { key: 'snowboard', value: '501' },
  xcSki: { key: 'xcSki', value: '502' },
  skiTouring: { key: 'skiTouring', value: '503' },
  skiTouringOld: { key: 'skiTouringOld', value: '10002' },
  multiSport: { key: 'multiSport', value: '10001' },
  speedsurfing: { key: 'speedsurfing', value: '706' },
  windsurfing: { key: 'windsurfing', value: '705' },
  row: { key: 'row', value: '700' },
  indoorRow: { key: 'indoorRow', value: '701' },
  whitewater: { key: 'whitewater', value: '702' },
  flatwater: { key: 'flatwater', value: '704' },
  multiPitch: { key: 'multiPitch', value: '10003' },
  climb: { key: 'climb', value: '106' },
  indoorClimb: { key: 'indoorClimb', value: '800' },
  bouldering: { key: 'bouldering', value: '801' },
  walk: { key: 'walk', value: '900' },
  jumpRope: { key: 'jumpRope', value: '901' },
  climbStairs: { key: 'climbStairs', value: '902' },
  customSport: { key: 'customSport', value: '98' },
};

export const SportTypeKeys: SportTypeKey[] = Object.values(AllSportTypes).map(({ key }) => key);
export const DefaultSportType = AllSportTypes.all;

export const getSportTypeValueFromKey = (value: SportTypeKey) => {
  return AllSportTypes[value].value;
};

export const isValidSportTypeKey = (value: string): value is SportTypeKey => {
  return Object.keys(AllSportTypes).some((it) => it === value);
};
