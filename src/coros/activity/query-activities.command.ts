import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { CorosConfigService } from '../coros.config';
import { BaseCommand } from '../../command/base.command';
import {
  array,
  date,
  Input,
  maxValue,
  minValue,
  number,
  object,
  ObjectEntries,
  ObjectSchema,
  optional,
  string,
} from 'valibot';
import { CorosAuthenticationService } from '../coros-authentication.service';
import dayjs from 'dayjs';
import { CorosResponse } from '../common';
import { URL } from 'node:url';

export const QueryActivitiesInput = object({
  pageSize: optional(
    number([minValue(1, 'Page size must be at least 1'), maxValue(200, 'Page size must not exceed 200')]),
  ),
  pageNumber: optional(number([minValue(1, 'Page number must be at least 1')])),
  from: optional(date()),
  to: optional(date()),
});
export type QueryActivitiesInput = Input<typeof QueryActivitiesInput>;

export const QueryActivitiesData = object({
  count: number(),
  dataList: array(
    object({
      adjustedPace: number(),
      ascent: number(),
      avg5x10s: number(),
      avgCadence: number(),
      avgHr: number(),
      avgPower: number(),
      avgSpeed: number(),
      avgStrkRate: number(),
      best: number(),
      best500m: number(),
      bestKm: number(),
      bestLen: number(),
      bodyTemperature: number(),
      cadence: number(),
      calorie: number(),
      date: number(),
      descent: number(),
      device: string(),
      deviceSportMode: number(),
      distance: number(),
      downhillDesc: number(),
      downhillDist: number(),
      downhillTime: number(),
      endTime: number(),
      endTimezone: number(),
      hasMessage: number(),
      imageUrl: string(),
      imageUrlType: number(),
      isRunTest: number(),
      isShowMs: number(),
      labelId: string(),
      lengths: number(),
      max2s: number(),
      maxGrade: number(),
      maxSlope: number(),
      maxSpeed: number(),
      mode: number(),
      name: string(),
      np: number(),
      pitch: number(),
      sets: number(),
      speedType: number(),
      sportType: number(),
      startTime: number(),
      startTimezone: number(),
      step: number(),
      subMode: number(),
      swolf: number(),
      total: number(),
      totalDescent: number(),
      totalReps: number(),
      totalTime: number(),
      trainingLoad: number(),
      unitType: number(),
      waterTemperature: number(),
      workoutTime: number(),
    }),
  ),
  pageNumber: number(),
  totalPage: number(),
});
export type QueryActivitiesData = Input<typeof QueryActivitiesData>;

export const QueryActivitiesResponse = CorosResponse(QueryActivitiesData);
export type QueryActivitiesResponse = Input<typeof QueryActivitiesResponse>;

@Injectable()
export class QueryActivitiesCommand extends BaseCommand<QueryActivitiesInput, QueryActivitiesResponse> {
  constructor(
    private readonly httpService: HttpService,
    private readonly corosConfig: CorosConfigService,
    private readonly corosAuthenticationService: CorosAuthenticationService,
  ) {
    super();
  }

  protected inputValidator(): ObjectSchema<ObjectEntries, undefined, QueryActivitiesInput> {
    return QueryActivitiesInput;
  }

  protected responseValidator(): ObjectSchema<ObjectEntries, undefined, QueryActivitiesResponse> {
    return QueryActivitiesResponse;
  }

  async handle({ pageSize = 20, pageNumber = 1, from, to }: QueryActivitiesInput): Promise<QueryActivitiesData> {
    const url = new URL('/activity/query', this.corosConfig.apiUrl);
    url.searchParams.append('size', String(pageSize));
    url.searchParams.append('pageNumber', String(pageNumber));

    if (from) {
      url.searchParams.append('startDay', dayjs(from).format('YYYYMMDD'));
    }

    if (to) {
      url.searchParams.append('endDay', dayjs(to).format('YYYYMMDD'));
    }

    const { data } = await this.httpService.axiosRef.get(url.toString(), {
      headers: {
        accessToken: this.corosAuthenticationService.accessToken,
      },
    });

    this.assertCorosResponseBase(data);
    this.assertCorosResponse(data);

    return data.data;
  }
}
