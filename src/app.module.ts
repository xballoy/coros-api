import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ExportActivitiesCommandRunner } from './command-runner/export-activities.command-runner';
import { DownloadFile } from './core/download-file.service';
import { CorosModule } from './coros/coros.module';
import { ConfigurationModule } from './infrastructure/configuration/configuration.module';

@Module({
  imports: [ConfigurationModule, CorosModule, HttpModule],
  providers: [ExportActivitiesCommandRunner, DownloadFile],
})
export class AppModule {}
