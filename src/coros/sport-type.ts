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
  | 'boatFishingLure'
  | 'shoreFishingLure'
  | 'pondFishingLure'
  | 'kayakFishingLure'
  | 'inshoreFishing'
  | 'offshoreFishing'
  | 'boatFlyFishing'
  | 'shoreFlyFishing'
  | 'surfFishing'
  | 'outdoorClimb'
  | 'elliptical'
  | 'yoga'
  | 'pilates'
  | 'boxing'
  | 'badminton'
  | 'tableTennis'
  | 'basketball'
  | 'football'
  | 'pickleball'
  | 'tennis'
  | 'padel'
  | 'frisbee'
  | 'skateboarding'
  | 'hyrox'
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
  boatFishingLure: { key: 'boatFishingLure', value: '707' },
  shoreFishingLure: { key: 'shoreFishingLure', value: '708' },
  pondFishingLure: { key: 'pondFishingLure', value: '709' },
  kayakFishingLure: { key: 'kayakFishingLure', value: '710' },
  inshoreFishing: { key: 'inshoreFishing', value: '711' },
  offshoreFishing: { key: 'offshoreFishing', value: '712' },
  boatFlyFishing: { key: 'boatFlyFishing', value: '713' },
  shoreFlyFishing: { key: 'shoreFlyFishing', value: '714' },
  surfFishing: { key: 'surfFishing', value: '715' },
  outdoorClimb: { key: 'outdoorClimb', value: '802' },
  elliptical: { key: 'elliptical', value: '903' },
  yoga: { key: 'yoga', value: '904' },
  pilates: { key: 'pilates', value: '905' },
  boxing: { key: 'boxing', value: '906' },
  badminton: { key: 'badminton', value: '1000' },
  tableTennis: { key: 'tableTennis', value: '1001' },
  basketball: { key: 'basketball', value: '1002' },
  football: { key: 'football', value: '1003' },
  pickleball: { key: 'pickleball', value: '1004' },
  tennis: { key: 'tennis', value: '1005' },
  padel: { key: 'padel', value: '1006' },
  frisbee: { key: 'frisbee', value: '1100' },
  skateboarding: { key: 'skateboarding', value: '1101' },
  hyrox: { key: 'hyrox', value: '1200' },
  customSport: { key: 'customSport', value: '98' },
};

export const SportTypeKeys: SportTypeKey[] = Object.values(AllSportTypes).map(({ key }) => key);
export const DefaultSportType = AllSportTypes.all;

export const getSportTypeValueFromKey = (value: SportTypeKey) => {
  return AllSportTypes[value].value;
};

export const isValidSportTypeKey = (value: string): value is SportTypeKey => {
  return Object.keys(AllSportTypes).includes(value);
};
