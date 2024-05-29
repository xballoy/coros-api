import { Injectable } from '@nestjs/common';
import type { LoginRequest } from './account/login.request';
import type { DownloadActivityDetailRequest } from './activity/download-activity-detail.request';
import type { QueryActivitiesRequest } from './activity/query-activities.request';

@Injectable()
export class CorosAPI {
  constructor(
    private readonly loginCommand: LoginRequest,
    private readonly queryActivitiesCommand: QueryActivitiesRequest,
    private readonly downloadActivityDetailCommand: DownloadActivityDetailRequest,
  ) {}

  async login() {
    return await this.loginCommand.run({});
  }

  async queryActivities({ from, to, page, size }: { from?: Date; to?: Date; size?: number; page?: number }) {
    return await this.queryActivitiesCommand.run({ from, to, pageSize: size, pageNumber: page });
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
}
