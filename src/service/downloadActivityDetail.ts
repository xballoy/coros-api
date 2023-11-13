import axios, { AxiosResponse } from 'axios';
import { BASE_URL, CorosResponse } from './common.js';

export type DownloadActivityDetailResponse = {
  fileUrl: string;
};

type DownloadActivityDetail = {
  labelId: string;
  sportType: number;
};
export const downloadActivityDetail =
  (accessToken: string) =>
  async ({ labelId, sportType }: DownloadActivityDetail): Promise<DownloadActivityDetailResponse> => {
    const url = new URL(`${BASE_URL}/activity/detail/download`);
    url.searchParams.append('labelId', labelId);
    url.searchParams.append('sportType', String(sportType));
    url.searchParams.append('fileType', '4');

    const response = await axios.post<
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
  };
