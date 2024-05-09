import { URL } from 'node:url';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import dayjs from 'dayjs';
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
import { BaseRequest } from '../base-request';
import { CorosResponse } from '../common';
import { CorosAuthenticationService } from '../coros-authentication.service';
import { CorosConfigService } from '../coros.config';

export const QueryActivitiesInput = object({
  pageSize: optional(
    number([minValue(1, 'Page size must be at least 1'), maxValue(200, 'Page size must not exceed 200')]),
  ),
  pageNumber: optional(number([minValue(1, 'Page number must be at least 1')])),
  from: optional(date()),
  to: optional(date()),
});
export type QueryActivitiesInput = Input<typeof QueryActivitiesInput>;

export const Activity = object({
  date: number(),
  labelId: string(),
  name: string(),
  sportType: number(),
});
export const QueryActivitiesData = object({
  count: number(),
  dataList: array(Activity),
  pageNumber: number(),
  totalPage: number(),
});
export type QueryActivitiesData = Input<typeof QueryActivitiesData>;

export const QueryActivitiesResponse = CorosResponse(QueryActivitiesData);
export type QueryActivitiesResponse = Input<typeof QueryActivitiesResponse>;

export const QueryActivitiesOutput = object({
  count: number(),
  activities: array(Activity),
});
export type QueryActivitiesOutput = Input<typeof QueryActivitiesOutput>;

@Injectable()
export class QueryActivitiesRequest extends BaseRequest<
  QueryActivitiesInput,
  QueryActivitiesResponse,
  QueryActivitiesOutput
> {
  private readonly logger = new Logger(QueryActivitiesRequest.name);

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

  async handle({ pageSize = 20, pageNumber = 1, from, to }: QueryActivitiesInput): Promise<QueryActivitiesOutput> {
    const activities = await this.getActivities({ pageSize, pageNumber, from, to });

    return {
      count: activities.length,
      activities,
    };
  }

  private async getActivities({
    pageSize,
    pageNumber,
    from,
    to,
  }: {
    pageSize: number;
    pageNumber: number;
    from?: Date;
    to?: Date;
  }): Promise<QueryActivitiesData['dataList']> {
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
    this.logger.verbose('Query activity response', data);

    this.assertCorosResponseBase(data);
    this.assertCorosResponse(data);

    const {
      data: { dataList, totalPage },
    } = data;

    const activities = [...dataList];
    if (pageNumber < totalPage) {
      const next = await this.getActivities({ pageSize, pageNumber: pageNumber + 1, from, to });
      activities.push(...next);
    }
    return activities;
  }
}
