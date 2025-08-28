import { URL } from 'node:url';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import {
  CONFIGURATION_SERVICE_TOKEN,
  ConfigurationService,
} from '../../infrastructure/configuration/configuration.service';
import { BaseRequest } from '../base-request';
import { CorosResponse } from '../common';

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
  private readonly configurationService: ConfigurationService;

  constructor(httpService: HttpService, @Inject(CONFIGURATION_SERVICE_TOKEN) corosConfig: ConfigurationService) {
    super();
    this.configurationService = corosConfig;
    this.httpService = httpService;
  }

  protected inputValidator(): z.Schema<DownloadActivityDetailInput> {
    return DownloadActivityDetailInput;
  }

  protected responseValidator(): z.Schema<DownloadActivityDetailResponse> {
    return DownloadActivityDetailResponse;
  }

  async handle({ labelId, sportType, fileType }: DownloadActivityDetailInput): Promise<DownloadActivityDetailData> {
    const url = new URL('/activity/detail/download', this.configurationService.apiUrl);
    url.searchParams.append('labelId', labelId);
    url.searchParams.append('sportType', String(sportType));
    url.searchParams.append('fileType', fileType);

    const { data } = await this.httpService.axiosRef.post(url.toString(), undefined);
    this.logger.verbose('Download activity detail response', data);

    this.assertCorosResponseBase(data);
    this.assertCorosResponse(data);

    return data.data;
  }
}
