import { HttpService } from '@nestjs/axios';

export type LocaleMap = Record<string, string>;

const LOCALE_URL = 'https://static.coros.com/locale/coros-traininghub-v2/en-US.prod.js';

export const parseLocalePayload = (text: string): LocaleMap => {
  let payload: string | undefined;
  const marker = 'window.en_US=';
  const markerIndex = text.indexOf(marker);
  if (markerIndex !== -1) {
    payload = text.slice(markerIndex + marker.length).trim();
  } else {
    const match = new RegExp(/window\.en_US\s*=\s*(\{[\s\S]*})/).exec(text);
    if (match) {
      payload = match[1];
    }
  }

  if (!payload) {
    throw new Error('Locale map did not contain expected window.en_US payload');
  }

  if (payload.endsWith(';')) {
    payload = payload.slice(0, -1);
  }

  return JSON.parse(payload) as LocaleMap;
};

export const fetchLocaleMap = async (httpService: HttpService): Promise<LocaleMap> => {
  const { data } = await httpService.axiosRef.get<string>(LOCALE_URL);
  return parseLocalePayload(data);
};
