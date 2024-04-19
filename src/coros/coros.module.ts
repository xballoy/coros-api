import { Module } from '@nestjs/common';
import { CorosConfigService } from './coros.config';
import { CorosAPI } from './coros-api';
import { CorosAuthenticationService } from './coros-authentication.service';
import { LoginRequest } from './account/login.request';
import { QueryActivitiesRequest } from './activity/query-activities.request';
import { DownloadActivityDetailRequest } from './activity/download-activity-detail.request';
import { HttpModule } from '@nestjs/axios';

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
