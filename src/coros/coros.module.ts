import { Module } from '@nestjs/common';
import { CorosConfigService } from './coros.config';
import { CorosAPI } from './coros-api';
import { CorosAuthenticationService } from './coros-authentication.service';
import { LoginCommand } from './account/login.command';
import { QueryActivitiesCommand } from './activity/query-activities.command';
import { DownloadActivityDetailCommand } from './activity/download-activity-detail.command';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [
    CorosConfigService,
    CorosAuthenticationService,
    CorosAPI,
    LoginCommand,
    QueryActivitiesCommand,
    DownloadActivityDetailCommand,
  ],
  exports: [CorosAPI],
})
export class CorosModule {}
