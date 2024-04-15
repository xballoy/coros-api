import { BASE_URL, CorosResponse } from './common.js';
import { TrainingType } from './training-type.js';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';

export type QueryActivitiesResponse = {
  count: number;
  dataList: {
    adjustedPace: number;
    ascent: number;
    avg5x10s: number;
    avgCadence: number;
    avgHr: number;
    avgPower: number;
    avgSpeed: number;
    avgStrkRate: number;
    best: number;
    best500m: number;
    bestKm: number;
    bestLen: number;
    bodyTemperature: number;
    cadence: number;
    calorie: number;
    date: number;
    descent: number;
    device: string;
    distance: number;
    distanceModify: number;
    downhillDesc: number;
    downhillDist: number;
    downhillTime: number;
    endTime: number;
    endTimezone: number;
    hasMessage: number;
    imageUrl: string;
    imageUrlType: number;
    isShowMs: number;
    labelId: string;
    lengths: number;
    max2s: number;
    maxGrade: number;
    maxSlope: number;
    maxSpeed: number;
    mode: number;
    name: string;
    np: number;
    pitch: number;
    sets: number;
    speedType: number;
    sportType: number;
    startTime: number;
    startTimezone: number;
    step: number;
    subMode: number;
    swolf: number;
    total: number;
    totalDescent: number;
    totalTime: number;
    trainingLoad: number;
    unitType: number;
    waterTemperature: number;
    workoutTime: number;
  }[];
  pageNumber: number;
  totalPage: number;
};

type QueryActivities = {
  // Number of activity to get, must be greater than 0
  size: number;
  // Page number, start at 1
  pageNumber: number;
  modeList?: TrainingType;
  // Start day, using yyyymmdd format
  startDay?: string;
  // End day, using yyyymmdd format
  endDay?: string;
  keywords?: string;
};

@Injectable()
export class QueryActivitiesCommand {
  constructor(private readonly httpService: HttpService) {}

  async handle(accessToken: string, { size, pageNumber, modeList }: QueryActivities): Promise<QueryActivitiesResponse> {
    const url = new URL(`${BASE_URL}/activity/query`);
    url.searchParams.append('size', String(size));
    url.searchParams.append('pageNumber', String(pageNumber));
    if (modeList) {
      url.searchParams.append('modeList', String(modeList));
    }

    const response = await this.httpService.axiosRef.get<CorosResponse<QueryActivitiesResponse>>(url.toString(), {
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        accessToken,
      },
    });

    if (response.data.result !== '0000') {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }
}
