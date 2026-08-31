import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ExportActivitiesCommandRunner } from './command-runner/export-activities.command-runner.js';
import { ExportTrainingScheduleCommandRunner } from './command-runner/export-training-schedule.command-runner.js';
import { DownloadFile } from './core/download-file.service.js';
import { CorosModule } from './coros/coros.module.js';

@Module({
  imports: [CorosModule, HttpModule],
  providers: [ExportActivitiesCommandRunner, ExportTrainingScheduleCommandRunner, DownloadFile],
})
export class AppModule {}
