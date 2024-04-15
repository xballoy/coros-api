import { Module } from '@nestjs/common';
import { ExportActivitiesCommand } from './export-activities.command';

@Module({
  providers: [ExportActivitiesCommand],
})
export class AppModule {}
