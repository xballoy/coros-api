import { Injectable } from '@nestjs/common';
import { LoginCommand } from './account/login.command';
import { QueryActivitiesCommand } from './activity/query-activities.command';
import { DownloadActivityDetailCommand } from './activity/download-activity-detail.command';

@Injectable()
export class CorosAPI {
  constructor(
    private readonly loginCommand: LoginCommand,
    private readonly queryActivitiesCommand: QueryActivitiesCommand,
    private readonly downloadActivityDetailCommand: DownloadActivityDetailCommand,
  ) {}

  async login() {
    await this.loginCommand.run({});
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
