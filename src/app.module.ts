import { Module } from '@nestjs/common';
import { ExportActivitiesCommandRunner } from './command-runner/export-activities.command-runner';
import { DownloadFileCommand } from './service/download-file.command';
import { CorosModule } from './coros/coros.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [CorosModule, HttpModule],
  providers: [ExportActivitiesCommandRunner, DownloadFileCommand],
})
export class AppModule {}
