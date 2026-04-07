import { URL } from 'node:url';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import dayjs from 'dayjs';
import { z } from 'zod';
import { BaseRequest } from '../base-request';
import { CorosResponse } from '../common';
import { CorosConfigService } from '../coros.config';
import { CorosAuthenticationService } from '../coros-authentication.service';

export const QueryTrainingScheduleInput = z.object({
  startDate: z.date(),
  endDate: z.date(),
  supportRestExercise: z.number().default(1),
});
export type QueryTrainingScheduleInput = z.infer<typeof QueryTrainingScheduleInput>;

export const TrainingScheduleSportData = z.object({
  name: z.string().optional(),
  distance: z.number().optional(),
  duration: z.number().optional(),
  happenDay: z.string().optional(),
});
export type TrainingScheduleSportData = z.infer<typeof TrainingScheduleSportData>;

export const TrainingScheduleEntity = z.object({
  id: z.string(),
  idInPlan: z.string(),
  planProgramId: z.string(),
  happenDay: z.string(),
  sportData: TrainingScheduleSportData.optional(),
});
export type TrainingScheduleEntity = z.infer<typeof TrainingScheduleEntity>;

export const TrainingScheduleProgram = z.object({
  idInPlan: z.string(),
  name: z.string(),
  overview: z.string().optional(),
  distance: z.number().optional(),
  duration: z.number().optional(),
});
export type TrainingScheduleProgram = z.infer<typeof TrainingScheduleProgram>;

export const QueryTrainingScheduleData = z.object({
  entities: z.array(TrainingScheduleEntity),
  programs: z.array(TrainingScheduleProgram),
});
export type QueryTrainingScheduleData = z.infer<typeof QueryTrainingScheduleData>;

export const QueryTrainingScheduleResponse = CorosResponse(QueryTrainingScheduleData);
export type QueryTrainingScheduleResponse = z.infer<typeof QueryTrainingScheduleResponse>;

@Injectable()
export class QueryTrainingScheduleRequest extends BaseRequest<
  QueryTrainingScheduleInput,
  QueryTrainingScheduleResponse,
  QueryTrainingScheduleData
> {
  private readonly logger = new Logger(QueryTrainingScheduleRequest.name);
  private readonly httpService: HttpService;
  private readonly corosConfig: CorosConfigService;
  private readonly corosAuthenticationService: CorosAuthenticationService;

  constructor(
    httpService: HttpService,
    corosConfig: CorosConfigService,
    corosAuthenticationService: CorosAuthenticationService,
  ) {
    super();
    this.corosAuthenticationService = corosAuthenticationService;
    this.corosConfig = corosConfig;
    this.httpService = httpService;
  }

  protected inputValidator(): z.Schema<QueryTrainingScheduleInput> {
    return QueryTrainingScheduleInput;
  }

  protected responseValidator(): z.Schema<QueryTrainingScheduleResponse> {
    return QueryTrainingScheduleResponse;
  }

  protected async handle(input: QueryTrainingScheduleInput): Promise<QueryTrainingScheduleData> {
    const url = new URL('/training/schedule/query', this.corosConfig.apiUrl);
    url.searchParams.append('startDate', dayjs(input.startDate).format('YYYYMMDD'));
    url.searchParams.append('endDate', dayjs(input.endDate).format('YYYYMMDD'));
    url.searchParams.append('supportRestExercise', String(input.supportRestExercise));

    const { data } = await this.httpService.axiosRef.get(url.toString(), {
      headers: {
        accesstoken: this.corosAuthenticationService.accessToken,
      },
    });

    this.logger.verbose('Query training schedule response', data);

    this.assertCorosResponseBase(data);
    this.assertCorosResponse(data);

    return data.data;
  }
}
