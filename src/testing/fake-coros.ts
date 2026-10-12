import { readFileSync } from 'node:fs';
import { HttpResponse, http } from 'msw';
import { z } from 'zod';
import { LoginResponse } from '../coros/account/login.request.js';
import { DownloadActivityDetailResponse } from '../coros/activity/download-activity-detail.request.js';
import { QueryActivitiesResponse } from '../coros/activity/query-activities.request.js';
import { CorosResponseBase } from '../coros/common.js';
import { QueryTrainingScheduleResponse } from '../coros/training-schedule/query-training-schedule.request.js';
import { COROS_API_BASE_URL, server } from './msw-server.js';

export const COROS_FILES_BASE_URL = 'http://coros-files.test';
export const LOCALE_URL = 'https://static.coros.com/locale/coros-traininghub-v2/en-US.prod.js';

const FILE_EXTENSIONS: Record<string, string> = { '0': 'csv', '1': 'gpx', '2': 'kml', '3': 'tcx', '4': 'fit' };

type RecordedActivity = NonNullable<z.input<typeof QueryActivitiesResponse>['data']['dataList']>[number];
type RecordedTrainingSchedule = z.input<typeof QueryTrainingScheduleResponse>['data'];
type RecordedCorosResponse = z.input<typeof CorosResponseBase>;

export type RecordedRequest = {
  method: string;
  url: URL;
  headers: Headers;
  body: Promise<unknown>;
};

function readRecordedText(fileName: string): string {
  return readFileSync(new URL(`./fixtures/recorded/${fileName}`, import.meta.url), 'utf8');
}

function assertMatchesCorosSchema<S extends z.ZodType>(
  schema: S,
  value: unknown,
  fileName: string,
): asserts value is z.input<S> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new Error(`Recorded ${fileName} no longer matches the Coros schema\n${z.prettifyError(result.error)}`);
  }
}

function readRecorded<S extends z.ZodType>(fileName: string, schema: S): z.input<S> {
  const value: unknown = JSON.parse(readRecordedText(fileName));
  assertMatchesCorosSchema(schema, value, fileName);
  return value;
}

const recordedLogin = () => readRecorded('login.json', LoginResponse);
const recordedQueryActivities = () => readRecorded('query-activities.json', QueryActivitiesResponse);
const recordedDownload = () => readRecorded('download-activity-detail-fit.json', DownloadActivityDetailResponse);
const recordedSchedule = () => readRecorded('training-schedule.json', QueryTrainingScheduleResponse);

export const RECORDED_ACCESS_TOKEN = recordedLogin().data.accessToken;

export function recordedActivities(): RecordedActivity[] {
  return recordedQueryActivities().data.dataList ?? [];
}

export function recordedTrainingSchedule(): RecordedTrainingSchedule {
  return recordedSchedule().data;
}

export function recordedInvalidCredentialsResponse(): RecordedCorosResponse {
  return readRecorded('login-invalid-credentials.json', CorosResponseBase);
}

export const DOWNLOAD_REJECTED_MESSAGE = 'The activity could not be exported.';

function corosErrorResponse(apiCode: string, message: string): RecordedCorosResponse {
  return { ...recordedInvalidCredentialsResponse(), apiCode, message, result: '1019' };
}

export function activityFileContent(labelId: string): string {
  return `binary-content-of-${labelId}`;
}

export type FakeCorosOptions = {
  loginResponse?: RecordedCorosResponse;
  activityPages?: RecordedActivity[][];
  detailDownloadCorosErrors?: string[];
  detailDownloadServerErrors?: string[];
  missingFiles?: string[];
  trainingSchedule?: RecordedTrainingSchedule;
  localeScript?: string | null;
};

export function fakeCoros(options: FakeCorosOptions = {}): { requests: RecordedRequest[] } {
  const {
    loginResponse = recordedLogin(),
    activityPages = [recordedActivities()],
    detailDownloadCorosErrors = [],
    detailDownloadServerErrors = [],
    missingFiles = [],
    trainingSchedule = recordedTrainingSchedule(),
    localeScript = readRecordedText('locale-en-US.txt'),
  } = options;
  const requests: RecordedRequest[] = [];

  server.events.on('request:start', ({ request }) => {
    const clone = request.clone();
    requests.push({
      method: request.method,
      url: new URL(request.url),
      headers: request.headers,
      body: clone.text().then((text) => (text ? JSON.parse(text) : undefined)),
    });
  });

  const queryActivitiesEnvelope = recordedQueryActivities();
  const downloadEnvelope = recordedDownload();
  const scheduleEnvelope = recordedSchedule();
  const total = activityPages.reduce((sum, page) => sum + page.length, 0);

  server.use(
    http.post(`${COROS_API_BASE_URL}/account/login`, () => HttpResponse.json(loginResponse)),
    http.get(`${COROS_API_BASE_URL}/activity/query`, ({ request }) => {
      const pageNumber = Number(new URL(request.url).searchParams.get('pageNumber'));
      return HttpResponse.json({
        ...queryActivitiesEnvelope,
        data: {
          count: total,
          dataList: activityPages[pageNumber - 1] ?? [],
          pageNumber,
          totalPage: activityPages.length,
        },
      });
    }),
    http.post(`${COROS_API_BASE_URL}/activity/detail/download`, ({ request }) => {
      const params = new URL(request.url).searchParams;
      const labelId = params.get('labelId') ?? '';
      if (detailDownloadCorosErrors.includes(labelId)) {
        return HttpResponse.json(corosErrorResponse(downloadEnvelope.apiCode, DOWNLOAD_REJECTED_MESSAGE));
      }
      if (detailDownloadServerErrors.includes(labelId)) {
        return new HttpResponse(null, { status: 500 });
      }
      const extension = FILE_EXTENSIONS[params.get('fileType') ?? ''];
      return HttpResponse.json({
        ...downloadEnvelope,
        data: { fileUrl: `${COROS_FILES_BASE_URL}/${labelId}.${extension}` },
      });
    }),
    http.get(`${COROS_FILES_BASE_URL}/:fileName`, ({ params }) => {
      const labelId = String(params.fileName).split('.')[0];
      if (missingFiles.includes(labelId)) {
        return new HttpResponse(null, { status: 404 });
      }
      return new HttpResponse(activityFileContent(labelId), {
        headers: { 'Content-Type': 'application/octet-stream' },
      });
    }),
    http.get(`${COROS_API_BASE_URL}/training/schedule/query`, () =>
      HttpResponse.json({ ...scheduleEnvelope, data: trainingSchedule }),
    ),
    http.get(LOCALE_URL, () => {
      if (localeScript === null) {
        return new HttpResponse(null, { status: 503 });
      }
      return new HttpResponse(localeScript, { headers: { 'Content-Type': 'application/javascript' } });
    }),
  );

  return { requests };
}
