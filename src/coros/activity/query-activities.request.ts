import { URL } from 'node:url';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import dayjs from 'dayjs';
import { z } from 'zod';
import { BaseRequest } from '../base-request';
import { CorosResponse } from '../common';
import { CorosAuthenticationService } from '../coros-authentication.service';
import { CorosConfigService } from '../coros.config';

export const QueryActivitiesInput = z.object({
  pageSize: z.number().min(1, 'Page size must be at least 1').max(200, 'Page size must not exceed 200').optional(),
  pageNumber: z.number().min(1, 'Page number must be at least 1').optional(),
  from: z.date().optional(),
  to: z.date().optional(),
});
export type QueryActivitiesInput = z.infer<typeof QueryActivitiesInput>;

export const Activity = z.object({
  date: z.number(),
  labelId: z.string(),
  name: z.string(),
  sportType: z.number(),
});
export const QueryActivitiesData = z.object({
  count: z.number(),
  dataList: z.array(Activity),
  pageNumber: z.number(),
  totalPage: z.number(),
});
export type QueryActivitiesData = z.infer<typeof QueryActivitiesData>;

export const QueryActivitiesResponse = CorosResponse(QueryActivitiesData);
export type QueryActivitiesResponse = z.infer<typeof QueryActivitiesResponse>;

export const QueryActivitiesOutput = z.object({
  count: z.number(),
  activities: z.array(Activity),
});
export type QueryActivitiesOutput = z.infer<typeof QueryActivitiesOutput>;

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

  protected inputValidator(): z.Schema<QueryActivitiesInput> {
    return QueryActivitiesInput;
  }

  protected responseValidator(): z.Schema<QueryActivitiesResponse> {
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
