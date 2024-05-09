import { URL } from 'node:url';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { Input, number, object, ObjectEntries, ObjectSchema, string } from 'valibot';
import { BaseRequest } from '../base-request';
import { CorosResponse } from '../common';
import { CorosAuthenticationService } from '../coros-authentication.service';
import { CorosConfigService } from '../coros.config';

export const DownloadActivityDetailInput = object({
  labelId: string(),
  sportType: number(),
  fileType: string(),
});
export type DownloadActivityDetailInput = Input<typeof DownloadActivityDetailInput>;

export const DownloadActivityDetailData = object({
  fileUrl: string(),
});
export type DownloadActivityDetailData = Input<typeof DownloadActivityDetailData>;

export const DownloadActivityDetailResponse = CorosResponse(DownloadActivityDetailData);
export type DownloadActivityDetailResponse = Input<typeof DownloadActivityDetailResponse>;

@Injectable()
export class DownloadActivityDetailRequest extends BaseRequest<
  DownloadActivityDetailInput,
  DownloadActivityDetailResponse
> {
  private readonly logger = new Logger(DownloadActivityDetailRequest.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly corosConfig: CorosConfigService,
    private readonly corosAuthenticationService: CorosAuthenticationService,
  ) {
    super();
  }

  protected inputValidator(): ObjectSchema<ObjectEntries, undefined, DownloadActivityDetailInput> {
    return DownloadActivityDetailInput;
  }

  protected responseValidator(): ObjectSchema<ObjectEntries, undefined, DownloadActivityDetailResponse> {
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
