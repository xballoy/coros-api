import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CorosConfigService } from '../coros.config';
import { CorosAuthenticationService } from '../coros-authentication.service';
import { URL } from 'node:url';
import { BaseCommand } from '../../command/base.command';
import { Input, number, object, ObjectEntries, ObjectSchema, string } from 'valibot';
import { CorosResponse } from '../common';

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
export class DownloadActivityDetailCommand extends BaseCommand<
  DownloadActivityDetailInput,
  DownloadActivityDetailResponse
> {
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

    this.assertCorosResponseBase(data);
    this.assertCorosResponse(data);

    return data.data;
  }
}
