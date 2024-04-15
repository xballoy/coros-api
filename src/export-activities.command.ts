import { Command, CommandRunner, Option } from 'nest-commander';
import { parse, format } from 'date-fns';
import { queryActivities, login, downloadActivityDetail, downloadFile } from './service';

type Flags = {
  user: string;
  password: string;
  outDir: string;
};

@Command({ name: 'export-activities', description: 'Bulk export your Coros activities' })
export class ExportActivitiesCommand extends CommandRunner {
  async run(_passedParams: string[], { user, password, outDir }: Flags): Promise<void> {
    const { accessToken } = await login({ username: user, password });

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
