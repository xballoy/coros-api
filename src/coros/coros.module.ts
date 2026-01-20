import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { LoginRequest } from './account/login.request';
import { DownloadActivityDetailRequest } from './activity/download-activity-detail.request';
import { QueryActivitiesRequest } from './activity/query-activities.request';
import { CorosConfigService } from './coros.config';
import { CorosAPI } from './coros-api';
import { CorosAuthenticationService } from './coros-authentication.service';
import { QueryTrainingScheduleRequest } from './training-schedule/query-training-schedule.request';

@Module({
  imports: [HttpModule],
  providers: [
    CorosConfigService,
    CorosAuthenticationService,
    CorosAPI,
    LoginRequest,
    QueryActivitiesRequest,
    DownloadActivityDetailRequest,
    QueryTrainingScheduleRequest,
  ],
  exports: [CorosAPI],
})
export class CorosModule {}
