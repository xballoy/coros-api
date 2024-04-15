import { Module } from '@nestjs/common';
import { ExportActivitiesCommandRunner } from './command-runner/export-activities.command-runner';
import { HttpModule } from '@nestjs/axios';
import { LoginCommand } from './service/login.command';
import { QueryActivitiesCommand } from './service/query-activities.command';
import { DownloadActivityDetailCommand } from './service/download-activity-detail.command';
import { DownloadFileCommand } from './service/download-file.command';

@Module({
  imports: [HttpModule],
  providers: [
    ExportActivitiesCommandRunner,
    LoginCommand,
    QueryActivitiesCommand,
    DownloadActivityDetailCommand,
    DownloadFileCommand,
  ],
})
export class AppModule {}
