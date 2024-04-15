import { BASE_URL, CorosResponse } from './common.js';
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';

export type DownloadActivityDetailResponse = {
  fileUrl: string;
};

type DownloadActivityDetail = {
  labelId: string;
  sportType: number;
};

@Injectable()
export class DownloadActivityDetailCommand {
  constructor(private readonly httpService: HttpService) {}

  async handle(
    accessToken: string,
    { labelId, sportType }: DownloadActivityDetail,
  ): Promise<DownloadActivityDetailResponse> {
    const url = new URL(`${BASE_URL}/activity/detail/download`);
    url.searchParams.append('labelId', labelId);
    url.searchParams.append('sportType', String(sportType));
    url.searchParams.append('fileType', '4');

    const response = await this.httpService.axiosRef.post<
      CorosResponse<DownloadActivityDetailResponse>,
      AxiosResponse<CorosResponse<DownloadActivityDetailResponse>>
    >(url.toString(), undefined, {
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        accessToken,
      },
    });

    if (response.data.result !== '0000') {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }
}
