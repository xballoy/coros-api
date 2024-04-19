import { Module } from '@nestjs/common';
import { ExportActivitiesCommandRunner } from './command-runner/export-activities.command-runner';
import { DownloadFile } from './core/download-file.service';
import { CorosModule } from './coros/coros.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [CorosModule, HttpModule],
  providers: [ExportActivitiesCommandRunner, DownloadFile],
})
export class AppModule {}
