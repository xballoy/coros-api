import meow from 'meow';
import { parse, format } from 'date-fns';
import { queryActivities, login, downloadActivityDetail, downloadFile } from './service';

(async () => {
  const cli = meow(
    `
    Usage:
        ts-node src/index.ts [options]

    Options:
        -u, --user          Coros username (required)
        -p, --password      Coros password (required)
        -o, --out           out directory
        -h, --help          print usage information
`,
    {
      importMeta: import.meta,
      flags: {
        help: {
          alias: 'h',
        },
        username: {
          type: 'string',
          alias: 'u',
        },
        password: {
          type: 'string',
          alias: 'p',
        },
        out: {
          type: 'string',
          alias: 'o',
        },
      },
      autoVersion: false,
      autoHelp: true,
    }
  );

  if (!cli.flags.username || !cli.flags.password || !cli.flags.out) {
    cli.showHelp();
    return 1;
  }
  const { username, password, out: outDir } = cli.flags;

  const { accessToken } = await login({ username, password });

  const activities = await queryActivities(accessToken)({ size: 100, pageNumber: 1 });
  const activitiesToDownload = activities.dataList.map((it) => {
    const activityDate = parse(String(it.date), 'yyyymmdd', new Date());

    return {
      labelId: it.labelId,
      sportType: it.sportType,
      fileName: `${format(activityDate, 'yyyy-mm-dd')}_${it.name.trim()}_${it.labelId}.fit`,
    };
  });

  for (const { labelId, sportType, fileName } of activitiesToDownload) {
    const { fileUrl } = await downloadActivityDetail(accessToken)({ labelId, sportType });
    await downloadFile(fileUrl, outDir, fileName);
  }
})();
