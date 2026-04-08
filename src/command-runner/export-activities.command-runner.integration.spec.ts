import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Test } from '@nestjs/testing';
import { HttpResponse, http } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../app.module';
import { buildDownloadActivityDetailResponse } from '../testing/fixtures/download-activity';
import { buildLoginResponse } from '../testing/fixtures/login';
import { buildActivity, buildQueryActivitiesResponse } from '../testing/fixtures/query-activities';
import { COROS_API_BASE_URL, server } from '../testing/msw-server';
import { ExportActivitiesCommandRunner } from './export-activities.command-runner';

const FILE_CONTENT = 'fake-fit-file-content';

function loginHandler() {
  return http.post(`${COROS_API_BASE_URL}/account/login`, () => {
    return HttpResponse.json(buildLoginResponse());
  });
}

function fileDownloadHandler(url: string, content = FILE_CONTENT) {
  return http.get(url, () => {
    return new HttpResponse(content, {
      headers: { 'Content-Type': 'application/octet-stream' },
    });
  });
}

describe('export-activities', () => {
  let tmpDir: string;
  const originalEnv = { ...process.env };

  beforeAll(() => {
    process.env.COROS_API_URL = COROS_API_BASE_URL;
    process.env.COROS_EMAIL = 'test@example.com';
    process.env.COROS_PASSWORD = 'testpassword';
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterAll(() => {
    server.close();
    process.env = originalEnv;
  });

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(tmpdir(), 'coros-test-'));
  });

  afterEach(async () => {
    server.resetHandlers();
    await rm(tmpDir, { recursive: true, force: true });
  });

  async function runCommand(flags: Record<string, unknown> = {}) {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    const runner = moduleRef.get(ExportActivitiesCommandRunner);
    const defaultFlags = { outDir: tmpDir, fileType: { key: 'fit', value: '4' }, sportTypes: ['-1'] };
    await runner.run([], { ...defaultFlags, ...flags } as never);

    await moduleRef.close();
  }

  it('exports a single activity file to disk', async () => {
    const fileUrl = `${COROS_API_BASE_URL}/files/activity-abc123.fit`;

    server.use(
      loginHandler(),
      http.get(`${COROS_API_BASE_URL}/activity/query`, () => {
        return HttpResponse.json(buildQueryActivitiesResponse());
      }),
      http.post(`${COROS_API_BASE_URL}/activity/detail/download`, () => {
        return HttpResponse.json(buildDownloadActivityDetailResponse(fileUrl));
      }),
      fileDownloadHandler(fileUrl),
    );

    await runCommand({});

    const files = await readdir(tmpDir);
    expect(files).toHaveLength(1);
    expect(files[0]).toBe('2025-01-15 Morning Run abc123.fit');

    const content = await readFile(path.join(tmpDir, files[0]), 'utf-8');
    expect(content).toBe(FILE_CONTENT);
  });

  it('handles pagination across multiple pages', async () => {
    const activity1 = buildActivity({ labelId: 'id-page1', name: 'Run Page 1', date: 20250110 });
    const activity2 = buildActivity({ labelId: 'id-page2', name: 'Run Page 2', date: 20250111 });
    let queryCallCount = 0;

    server.use(
      loginHandler(),
      http.get(`${COROS_API_BASE_URL}/activity/query`, () => {
        queryCallCount++;
        if (queryCallCount === 1) {
          return HttpResponse.json(
            buildQueryActivitiesResponse({ activities: [activity1], pageNumber: 1, totalPage: 2 }),
          );
        }
        return HttpResponse.json(
          buildQueryActivitiesResponse({ activities: [activity2], pageNumber: 2, totalPage: 2 }),
        );
      }),
      http.post(`${COROS_API_BASE_URL}/activity/detail/download`, ({ request }) => {
        const url = new URL(request.url);
        const labelId = url.searchParams.get('labelId');
        return HttpResponse.json(buildDownloadActivityDetailResponse(`${COROS_API_BASE_URL}/files/${labelId}.fit`));
      }),
      http.get(`${COROS_API_BASE_URL}/files/*`, () => {
        return new HttpResponse(FILE_CONTENT, {
          headers: { 'Content-Type': 'application/octet-stream' },
        });
      }),
    );

    await runCommand({});

    const files = (await readdir(tmpDir)).sort();
    expect(files).toHaveLength(2);
    expect(files).toContain('2025-01-10 Run Page 1 id-page1.fit');
    expect(files).toContain('2025-01-11 Run Page 2 id-page2.fit');
  });

  it('produces no files when no activities found', async () => {
    server.use(
      loginHandler(),
      http.get(`${COROS_API_BASE_URL}/activity/query`, () => {
        return HttpResponse.json(buildQueryActivitiesResponse({ activities: [] }));
      }),
    );

    await runCommand({});

    const files = await readdir(tmpDir);
    expect(files).toHaveLength(0);
  });

  it('continues downloading when one activity download fails', async () => {
    const activity1 = buildActivity({ labelId: 'ok-activity', name: 'Good Run', date: 20250120 });
    const activity2 = buildActivity({ labelId: 'bad-activity', name: 'Bad Run', date: 20250121 });
    const fileUrl = `${COROS_API_BASE_URL}/files/ok-activity.fit`;

    server.use(
      loginHandler(),
      http.get(`${COROS_API_BASE_URL}/activity/query`, () => {
        return HttpResponse.json(buildQueryActivitiesResponse({ activities: [activity1, activity2] }));
      }),
      http.post(`${COROS_API_BASE_URL}/activity/detail/download`, ({ request }) => {
        const url = new URL(request.url);
        const labelId = url.searchParams.get('labelId');
        if (labelId === 'bad-activity') {
          return new HttpResponse(null, { status: 500 });
        }
        return HttpResponse.json(buildDownloadActivityDetailResponse(fileUrl));
      }),
      fileDownloadHandler(fileUrl),
    );

    await runCommand({});

    const files = await readdir(tmpDir);
    expect(files).toHaveLength(1);
    expect(files[0]).toBe('2025-01-20 Good Run ok-activity.fit');
  });

  it('respects --exportType gpx', async () => {
    const fileUrl = `${COROS_API_BASE_URL}/files/activity.gpx`;
    let receivedFileType: string | null = null;

    server.use(
      loginHandler(),
      http.get(`${COROS_API_BASE_URL}/activity/query`, () => {
        return HttpResponse.json(buildQueryActivitiesResponse());
      }),
      http.post(`${COROS_API_BASE_URL}/activity/detail/download`, ({ request }) => {
        const url = new URL(request.url);
        receivedFileType = url.searchParams.get('fileType');
        return HttpResponse.json(buildDownloadActivityDetailResponse(fileUrl));
      }),
      fileDownloadHandler(fileUrl),
    );

    await runCommand({ fileType: { key: 'gpx', value: '1' } });

    const files = await readdir(tmpDir);
    expect(files).toHaveLength(1);
    expect(files[0]).toBe('2025-01-15 Morning Run abc123.gpx');
    expect(receivedFileType).toBe('1');
  });
});
