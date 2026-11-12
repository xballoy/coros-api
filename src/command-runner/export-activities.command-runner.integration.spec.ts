import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { runCorosCli, setupCliTest, TEST_EMAIL } from '../testing/cli-harness.js';
import {
  activityFileContent,
  COROS_FILES_BASE_URL,
  DOWNLOAD_REJECTED_MESSAGE,
  fakeCoros,
  RECORDED_ACCESS_TOKEN,
  recordedActivities,
  recordedInvalidCredentialsResponse,
} from '../testing/fake-coros.js';
import { COROS_API_BASE_URL } from '../testing/msw-server.js';

const TEST_PASSWORD_MD5 = '9cc2ae8a1ba7a93da39b46fc1019c481';

describe('coros-api export-activities', () => {
  const env = setupCliTest();

  const apiRequests = (requests: { url: URL }[], pathname: string) =>
    requests.filter((request) => request.url.pathname === pathname);

  it('exports every activity of the account as FIT files named after date, name and id', async () => {
    fakeCoros();

    const { exitCode } = await runCorosCli(['export-activities', '--out', env.outDir]);

    expect(exitCode).toBe(0);
    expect(await env.listFiles()).toEqual(
      [
        '2025-03-08 Morning Run 4 900000000000000005.fit',
        '2025-03-08 City Walk 1 900000000000000006.fit',
        '2025-03-08 Strength 900000000000000004.fit',
        '2025-03-09 Mountain Hike 2 900000000000000003.fit',
        '2025-03-10 City Walk 1 900000000000000002.fit',
      ].sort(),
    );
    expect(await env.readOutputFile('2025-03-10 City Walk 1 900000000000000002.fit')).toBe(
      activityFileContent('900000000000000002'),
    );
  });

  it('logs in with the md5 of the password and authenticates every API call with the returned token', async () => {
    const { requests } = fakeCoros();

    await runCorosCli(['export-activities', '--out', env.outDir]);

    const [login, ...others] = requests.filter((request) => request.url.origin === COROS_API_BASE_URL);
    expect(login.url.pathname).toBe('/account/login');
    expect(await login.body).toEqual({ account: TEST_EMAIL, accountType: 2, pwd: TEST_PASSWORD_MD5 });
    expect(others.length).toBeGreaterThan(0);
    for (const request of others) {
      expect(request.headers.get('accessToken')).toBe(RECORDED_ACCESS_TOKEN);
    }
  });

  it('queries all sport types without date bounds and downloads FIT by default', async () => {
    const { requests } = fakeCoros();

    await runCorosCli(['export-activities', '--out', env.outDir]);

    const [query] = apiRequests(requests, '/activity/query');
    expect(query.url.searchParams.get('modeList')).toBe('0');
    expect(query.url.searchParams.has('startDay')).toBe(false);
    expect(query.url.searchParams.has('endDay')).toBe(false);
    for (const download of apiRequests(requests, '/activity/detail/download')) {
      expect(download.url.searchParams.get('fileType')).toBe('4');
    }
  });

  it('sends the sport type of each activity when requesting its download', async () => {
    const { requests } = fakeCoros();

    await runCorosCli(['export-activities', '--out', env.outDir]);

    const sent = apiRequests(requests, '/activity/detail/download').map((request) => [
      request.url.searchParams.get('labelId'),
      request.url.searchParams.get('sportType'),
    ]);
    expect(sent).toEqual(recordedActivities().map((activity) => [activity.labelId, String(activity.sportType)]));
  });

  it('exports activities from every page of results', async () => {
    const [first, second, third, ...rest] = recordedActivities();
    const { requests } = fakeCoros({ activityPages: [[first, second], [third], rest] });

    const { exitCode } = await runCorosCli(['export-activities', '--out', env.outDir]);

    expect(exitCode).toBe(0);
    expect(await env.listFiles()).toHaveLength(5);
    expect(
      apiRequests(requests, '/activity/query').map((request) => request.url.searchParams.get('pageNumber')),
    ).toEqual(['1', '2', '3']);
  });

  it('exports GPX files with --exportType gpx', async () => {
    const { requests } = fakeCoros({ activityPages: [recordedActivities().slice(0, 1)] });

    const { exitCode } = await runCorosCli(['export-activities', '--out', env.outDir, '--exportType', 'gpx']);

    expect(exitCode).toBe(0);
    expect(await env.listFiles()).toEqual(['2025-03-10 City Walk 1 900000000000000002.gpx']);
    expect(apiRequests(requests, '/activity/detail/download')[0].url.searchParams.get('fileType')).toBe('1');
  });

  it('filters on the requested sport types', async () => {
    const { requests } = fakeCoros();

    await runCorosCli(['export-activities', '--out', env.outDir, '--exportSportTypes', 'run,bike']);

    expect(apiRequests(requests, '/activity/query')[0].url.searchParams.get('modeList')).toBe('100,200');
  });

  it('accepts every Training Hub sport type and sends its mode code', async () => {
    const { requests } = fakeCoros();

    await runCorosCli([
      'export-activities',
      '--out',
      env.outDir,
      '--exportSportTypes',
      'boatFishingLure,shoreFishingLure,pondFishingLure,kayakFishingLure,inshoreFishing,offshoreFishing,boatFlyFishing,shoreFlyFishing,surfFishing,outdoorClimb,elliptical,yoga,pilates,boxing,badminton,tableTennis,basketball,football,pickleball,tennis,padel,frisbee,skateboarding,hyrox',
    ]);

    expect(apiRequests(requests, '/activity/query')[0].url.searchParams.get('modeList')).toBe(
      '707,708,709,710,711,712,713,714,715,802,903,904,905,906,1000,1001,1002,1003,1004,1005,1006,1100,1101,1200',
    );
  });

  it('filters on the requested date range', async () => {
    const { requests } = fakeCoros();

    await runCorosCli(['export-activities', '--out', env.outDir, '--fromDate', '2025-03-01', '--toDate', '2025-03-09']);

    const query = apiRequests(requests, '/activity/query')[0].url.searchParams;
    expect(query.get('startDay')).toBe('20250301');
    expect(query.get('endDay')).toBe('20250309');
  });

  it.each([
    { args: ['--exportType', 'docx'], message: 'Invalid value docx for parameter exportType' },
    { args: ['--exportSportTypes', 'run,curling'], message: 'Invalid value curling for parameter sportType' },
    { args: ['--fromDate', '01/10/2026'], message: 'Invalid value 01/10/2026 for parameter fromDate' },
    { args: ['--toDate', '2026-13-01'], message: 'Invalid value 2026-13-01 for parameter toDate' },
  ])('rejects $args without contacting Coros', async ({ args, message }) => {
    const { requests } = fakeCoros();

    const { exitCode, output } = await runCorosCli(['export-activities', '--out', env.outDir, ...args]);

    expect(exitCode).toBe(1);
    expect(output).toContain(message);
    expect(requests).toEqual([]);
  });

  it('requires an output directory', async () => {
    const { requests } = fakeCoros();

    const { exitCode, output } = await runCorosCli(['export-activities']);

    expect(exitCode).toBe(1);
    expect(output).toContain("required option '-o, --out [outDir]' not specified");
    expect(requests).toEqual([]);
  });

  it('rejects an output directory that does not exist', async () => {
    const { requests } = fakeCoros();
    const missingDir = path.join(env.outDir, 'missing');

    const { exitCode, output } = await runCorosCli(['export-activities', '--out', missingDir]);

    expect(exitCode).toBe(1);
    expect(output).toContain(`Invalid value ${missingDir} for parameter out. Directory does not exist`);
    expect(requests).toEqual([]);
  });

  it('reports the Coros error and exports nothing when the credentials are rejected', async () => {
    const { requests } = fakeCoros({ loginResponse: recordedInvalidCredentialsResponse() });

    const { exitCode, output } = await runCorosCli(['export-activities', '--out', env.outDir]);

    expect(exitCode).toBe(1);
    expect(output).toContain('The login credentials you entered do not match our records.');
    expect(requests.map((request) => request.url.pathname)).toEqual(['/account/login']);
    expect(await env.listFiles()).toEqual([]);
  });

  it('fails without contacting Coros when the credentials are not configured', async () => {
    const { requests } = fakeCoros();
    vi.stubEnv('COROS_EMAIL', undefined);

    const { exitCode, output } = await runCorosCli(['export-activities', '--out', env.outDir]);

    expect(exitCode).toBe(1);
    expect(output).toMatch(/ERROR \[CommandFactory\] ZodError[\s\S]*"email"[\s\S]*expected string, received undefined/);
    expect(requests).toEqual([]);
  });

  it('keeps exporting the other activities when some files cannot be fetched, and exits with an error', async () => {
    fakeCoros({
      missingFiles: ['900000000000000003'],
      fileServerErrors: ['900000000000000005'],
    });

    const { exitCode, output } = await runCorosCli(['export-activities', '--out', env.outDir]);

    expect(exitCode).toBe(1);
    expect(output).toContain('2 of 5 downloads failed');
    expect(await env.listFiles()).toEqual([
      '2025-03-08 City Walk 1 900000000000000006.fit',
      '2025-03-08 Strength 900000000000000004.fit',
      '2025-03-10 City Walk 1 900000000000000002.fit',
    ]);
  });

  const FAILING_ACTIVITY = '900000000000000003';
  const FAILING_DETAIL_REQUEST = `${COROS_API_BASE_URL}/activity/detail/download`;
  const FAILING_FILE_REQUEST = `${COROS_FILES_BASE_URL}/${FAILING_ACTIVITY}.fit`;

  const urlWithoutQuery = (request: { url: URL }) => `${request.url.origin}${request.url.pathname}`;

  it.each([
    {
      failure: 'a revoked access token',
      options: { detailDownloadRevokedToken: [FAILING_ACTIVITY] },
      lastRequest: FAILING_DETAIL_REQUEST,
      messages: [
        'Access token is invalid',
        'Coros session ended, most likely because you logged in elsewhere (e.g. Coros Training Hub).',
      ],
    },
    {
      failure: 'rate limiting from the API',
      options: { detailDownloadRateLimited: [FAILING_ACTIVITY] },
      lastRequest: FAILING_DETAIL_REQUEST,
      messages: ['Coros is rate limiting requests.'],
    },
    {
      failure: 'an unknown Coros error',
      options: { detailDownloadCorosErrors: [FAILING_ACTIVITY] },
      lastRequest: FAILING_DETAIL_REQUEST,
      messages: [DOWNLOAD_REJECTED_MESSAGE, 'Coros API request failed.'],
    },
    {
      failure: 'a server error from the API',
      options: { detailDownloadServerErrors: [FAILING_ACTIVITY] },
      lastRequest: FAILING_DETAIL_REQUEST,
      messages: ['Coros API request failed.'],
    },
    {
      failure: 'rate limiting from the file host',
      options: { fileRateLimited: [FAILING_ACTIVITY] },
      lastRequest: FAILING_FILE_REQUEST,
      messages: ['Coros is rate limiting requests.'],
    },
  ])(
    'stops sending requests as soon as it meets $failure, keeping the files already exported',
    async ({ options, lastRequest, messages }) => {
      const { requests } = fakeCoros(options);

      const { exitCode, output } = await runCorosCli(['export-activities', '--out', env.outDir]);

      expect(exitCode).toBe(1);
      for (const message of messages) {
        expect(output).toContain(message);
      }
      expect(output).toContain('Export stopped: 1 of 5 activities exported.');
      expect(apiRequests(requests, '/account/login')).toHaveLength(1);
      expect(
        apiRequests(requests, '/activity/detail/download').map((request) => request.url.searchParams.get('labelId')),
      ).toEqual(['900000000000000002', FAILING_ACTIVITY]);
      expect(urlWithoutQuery(requests[requests.length - 1])).toBe(lastRequest);
      expect(await env.listFiles()).toEqual(['2025-03-10 City Walk 1 900000000000000002.fit']);
    },
  );

  it('writes files inside the output directory whatever the activity name', async () => {
    const [activity] = recordedActivities();
    fakeCoros({
      activityPages: [
        [
          { ...activity, labelId: '1', name: '../../etc/passwd' },
          { ...activity, labelId: '2', name: 'Run\\Ride' },
          { ...activity, labelId: '3', name: null },
          { ...activity, labelId: '4', name: '   ' },
        ],
      ],
    });

    const { exitCode } = await runCorosCli(['export-activities', '--out', env.outDir]);

    expect(exitCode).toBe(0);
    expect(await env.listFiles()).toEqual([
      '2025-03-10 ..-..-etc-passwd 1.fit',
      '2025-03-10 Activity 3.fit',
      '2025-03-10 Activity 4.fit',
      '2025-03-10 Run-Ride 2.fit',
    ]);
  });

  it('exports nothing and succeeds when there is no activity', async () => {
    const { requests } = fakeCoros({ activityPages: [] });

    const { exitCode } = await runCorosCli(['export-activities', '--out', env.outDir]);

    expect(exitCode).toBe(0);
    expect(await env.listFiles()).toEqual([]);
    expect(requests.filter((request) => request.url.origin === COROS_FILES_BASE_URL)).toEqual([]);
  });
});
