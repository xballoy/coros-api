import { Injectable } from '@nestjs/common';
import { LoginRequest } from './account/login.request';
import { DownloadActivityDetailRequest } from './activity/download-activity-detail.request';
import { QueryActivitiesRequest } from './activity/query-activities.request';
import { QueryTrainingScheduleRequest } from './training-schedule/query-training-schedule.request';

@Injectable()
export class CorosAPI {
  private readonly loginCommand: LoginRequest;
  private readonly queryActivitiesCommand: QueryActivitiesRequest;
  private readonly downloadActivityDetailCommand: DownloadActivityDetailRequest;
  private readonly queryTrainingScheduleCommand: QueryTrainingScheduleRequest;

  constructor(
    loginCommand: LoginRequest,
    queryActivitiesCommand: QueryActivitiesRequest,
    downloadActivityDetailCommand: DownloadActivityDetailRequest,
    queryTrainingScheduleCommand: QueryTrainingScheduleRequest,
  ) {
    this.downloadActivityDetailCommand = downloadActivityDetailCommand;
    this.queryActivitiesCommand = queryActivitiesCommand;
    this.loginCommand = loginCommand;
    this.queryTrainingScheduleCommand = queryTrainingScheduleCommand;
  }

  async login() {
    return await this.loginCommand.run({});
  }

  async queryActivities({
    from,
    to,
    page,
    size,
    sportTypes,
  }: {
    from?: Date;
    to?: Date;
    size?: number;
    page?: number;
    sportTypes: string[];
  }) {
    return await this.queryActivitiesCommand.run({
      from,
      to,
      pageSize: size,
      pageNumber: page,
      modeList: sportTypes.join(','),
    });
  }

  async downloadActivityDetail({
    sportType,
    fileType,
    labelId,
  }: {
    sportType: number;
    fileType: string;
    labelId: string;
  }) {
    return await this.downloadActivityDetailCommand.run({ sportType, fileType, labelId });
  }

  async queryTrainingSchedule({
    startDate,
    endDate,
    supportRestExercise = 1,
  }: {
    startDate: Date;
    endDate: Date;
    supportRestExercise?: number;
  }) {
    return await this.queryTrainingScheduleCommand.run({
      startDate,
      endDate,
      supportRestExercise,
    });
  }
}
