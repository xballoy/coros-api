import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { LoginRequest } from './account/login.request';
import { DownloadActivityDetailRequest } from './activity/download-activity-detail.request';
import { QueryActivitiesRequest } from './activity/query-activities.request';
import { CorosAPI } from './coros-api';
import { CorosAuthenticationService } from './coros-authentication.service';
import { CorosConfigService } from './coros.config';

@Module({
  imports: [HttpModule],
  providers: [
    CorosConfigService,
    CorosAuthenticationService,
    CorosAPI,
    LoginRequest,
    QueryActivitiesRequest,
    DownloadActivityDetailRequest,
  ],
  exports: [CorosAPI],
})
export class CorosModule {}
