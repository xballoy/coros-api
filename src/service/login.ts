import axios, { AxiosResponse } from 'axios';
import { createHash } from 'crypto';
import { BASE_URL, CorosResponse } from './common';

type LoginRequest = {
  account: string;
  accountType: number;
  pwd: string;
};
export type LoginResponse = {
  accessToken: string;
  birthday: number;
  countryCode: string;
  email: string;
  headPic: string;
  hrZoneType: number;
  maxHr: number;
  newMessageCount: number;
  nickname: string;
  regionId: number;
  rhr: number;
  runScoreList: {
    avgPace: number;
    distance: number;
    distanceRatio: number;
    distanceTargetTotal: number;
    distanceTotal: number;
    duration: number;
    durationRatio: number;
    durationTargetTotal: number;
    durationTotal: number;
    trainingLoadRatio: number;
    trainingLoadTargetTotal: number;
    trainingLoadTotal: number;
    type: number;
  }[];
  sex: number;
  stature: number;
  unit: number;
  userId: string;
  userProfile: {
    acceptTeamInvitation: number;
    age: number;
    allowCoachEditing: number;
    allowMembersView: number;
    allowsTeamViewHistorical: number;
    autoTrainingLoadData: number;
    facade: number;
    gender: number;
    language: string;
    region: number;
    showActivityMap: number;
    stature: number;
    weight: number;
  };
  weight: number;
  zoneData: {
    lthr: number;
    lthrZone: {
      hr: number;
      index: number;
      ratio: number;
    }[];
    ltsp: number;
    ltspZone: {
      index: number;
      pace: number;
      ratio: number;
    }[];
    ltspZoneDefault: {
      index: number;
      pace: number;
      ratio: number;
    }[];
    maxHr: number;
    maxHrZone: {
      hr: number;
      index: number;
      ratio: number;
    }[];
    rhr: number;
    rhrZone: {
      hr: number;
      index: number;
      ratio: number;
    }[];
  };
};

type Login = {
  username: string;
  password: string;
};
export const login = async ({ username, password }: Login): Promise<LoginResponse> => {
  const url = `${BASE_URL}/account/login`;
  const response = await axios.post<
    CorosResponse<LoginResponse>,
    AxiosResponse<CorosResponse<LoginResponse>>,
    LoginRequest
  >(url, {
    account: username,
    accountType: 2,
    pwd: createHash('md5').update(password).digest('hex'),
  });
  if (response.data.result !== '0000') {
    throw new Error(response.data.message);
  }

  return response.data.data;
};
