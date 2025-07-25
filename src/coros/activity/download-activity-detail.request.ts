import { URL } from 'node:url';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { BaseRequest } from '../base-request';
import { CorosResponse } from '../common';
import { CorosConfigService } from '../coros.config';
import { CorosAuthenticationService } from '../coros-authentication.service';

export const DownloadActivityDetailInput = z.object({
  labelId: z.string(),
  sportType: z.number(),
  fileType: z.string(),
});
export type DownloadActivityDetailInput = z.infer<typeof DownloadActivityDetailInput>;

export const DownloadActivityDetailData = z.object({
  fileUrl: z.string(),
});
export type DownloadActivityDetailData = z.infer<typeof DownloadActivityDetailData>;

export const DownloadActivityDetailResponse = CorosResponse(DownloadActivityDetailData);
export type DownloadActivityDetailResponse = z.infer<typeof DownloadActivityDetailResponse>;

@Injectable()
export class DownloadActivityDetailRequest extends BaseRequest<
  DownloadActivityDetailInput,
  DownloadActivityDetailResponse
> {
  private readonly logger = new Logger(DownloadActivityDetailRequest.name);
  private readonly httpService: HttpService;
  private readonly corosConfig: CorosConfigService;
  private readonly corosAuthenticationService: CorosAuthenticationService;

  constructor(
    httpService: HttpService,
    corosConfig: CorosConfigService,
    corosAuthenticationService: CorosAuthenticationService,
  ) {
    super();
    this.corosAuthenticationService = corosAuthenticationService;
    this.corosConfig = corosConfig;
    this.httpService = httpService;
  }

  protected inputValidator(): z.Schema<DownloadActivityDetailInput> {
    return DownloadActivityDetailInput;
  }

  protected responseValidator(): z.Schema<DownloadActivityDetailResponse> {
    return DownloadActivityDetailResponse;
  }

  async handle({ labelId, sportType, fileType }: DownloadActivityDetailInput): Promise<DownloadActivityDetailData> {
    const url = new URL('/activity/detail/download', this.corosConfig.apiUrl);
    url.searchParams.append('labelId', labelId);
    url.searchParams.append('sportType', String(sportType));
    url.searchParams.append('fileType', fileType);

    const { data } = await this.httpService.axiosRef.post(url.toString(), undefined, {
      headers: {
        accessToken: this.corosAuthenticationService.accessToken,
      },
    });
    this.logger.verbose('Download activity detail response', data);

    this.assertCorosResponseBase(data);
    this.assertCorosResponse(data);

    return data.data;
  }
}
