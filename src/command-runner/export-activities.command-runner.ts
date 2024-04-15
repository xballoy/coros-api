import { Command, CommandRunner, Option } from 'nest-commander';
import { parse, format } from 'date-fns';
import { LoginCommand } from '../service/login.command';
import { QueryActivitiesCommand } from '../service/query-activities.command';
import { DownloadActivityDetailCommand } from '../service/download-activity-detail.command';
import { DownloadFileCommand } from '../service/download-file.command';

type Flags = {
  user: string;
  password: string;
  outDir: string;
};

@Command({ name: 'export-activities', description: 'Bulk export your Coros activities' })
export class ExportActivitiesCommandRunner extends CommandRunner {
  constructor(
    private readonly loginCommand: LoginCommand,
    private readonly queryActivitiesCommand: QueryActivitiesCommand,
    private readonly downloadActivityDetailCommand: DownloadActivityDetailCommand,
    private readonly downloadFileCommand: DownloadFileCommand,
  ) {
    super();
  }

  async run(_passedParams: string[], { user, password, outDir }: Flags): Promise<void> {
    const { accessToken } = await this.loginCommand.handle({ username: user, password });

    const activities = await this.queryActivitiesCommand.handle(accessToken, { size: 100, pageNumber: 1 });
    const activitiesToDownload = activities.dataList.map((it) => {
      const activityDate = parse(String(it.date), 'yyyymmdd', new Date());

      return {
        labelId: it.labelId,
        sportType: it.sportType,
        fileName: `${format(activityDate, 'yyyy-mm-dd')}_${it.name.trim()}_${it.labelId}.fit`,
      };
    });

    for (const { labelId, sportType, fileName } of activitiesToDownload) {
      const { fileUrl } = await this.downloadActivityDetailCommand.handle(accessToken, { labelId, sportType });
      await this.downloadFileCommand.handle(fileUrl, outDir, fileName);
    }
  }

  @Option({
    name: 'user',
    flags: '-u, --user [user]',
    description: 'Coros username',
    required: true,
  })
  parseUser(user: string) {
    return user;
  }

  @Option({
    name: 'password',
    flags: '-p, --password [password]',
    description: 'Coros password',
    required: true,
  })
  parsePassword(password: string) {
    return password;
  }

  @Option({
    name: 'outDir',
    flags: '-o, --out [outDir]',
    description: 'Output directory',
    required: true,
  })
  parseOut(out: string) {
    return out;
  }
}
