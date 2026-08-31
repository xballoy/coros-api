import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { LoginRequest } from './account/login.request.js';
import { DownloadActivityDetailRequest } from './activity/download-activity-detail.request.js';
import { QueryActivitiesRequest } from './activity/query-activities.request.js';
import { CorosConfigService } from './coros.config.js';
import { CorosAPI } from './coros-api.js';
import { CorosAuthenticationService } from './coros-authentication.service.js';
import { QueryTrainingScheduleRequest } from './training-schedule/query-training-schedule.request.js';

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
