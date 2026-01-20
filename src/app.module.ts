import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ExportActivitiesCommandRunner } from './command-runner/export-activities.command-runner';
import { ExportTrainingScheduleCommandRunner } from './command-runner/export-training-schedule.command-runner';
import { DownloadFile } from './core/download-file.service';
import { CorosModule } from './coros/coros.module';

@Module({
  imports: [CorosModule, HttpModule],
  providers: [ExportActivitiesCommandRunner, ExportTrainingScheduleCommandRunner, DownloadFile],
})
export class AppModule {}
