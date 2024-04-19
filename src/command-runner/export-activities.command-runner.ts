import { Command, CommandRunner, Option } from 'nest-commander';
import { parse, format } from 'date-fns';
import { DownloadFileCommand } from '../service/download-file.command';
import { CorosAPI } from '../coros/coros-api';

type Flags = {
  outDir: string;
};

@Command({ name: 'export-activities', description: 'Bulk export your Coros activities' })
export class ExportActivitiesCommandRunner extends CommandRunner {
  constructor(
    private readonly downloadFileCommand: DownloadFileCommand,
    private readonly corosService: CorosAPI,
  ) {
    super();
  }

  async run(_passedParams: string[], { outDir }: Flags): Promise<void> {
    await this.corosService.login();

    const activities = await this.corosService.queryActivities({ size: 100, page: 1 });
    const activitiesToDownload = activities.dataList.map((it) => {
      const activityDate = parse(String(it.date), 'yyyymmdd', new Date());

      return {
        labelId: it.labelId,
        sportType: it.sportType,
        fileName: `${format(activityDate, 'yyyy-mm-dd')}_${it.name.trim()}_${it.labelId}.fit`,
      };
    });

    for (const { labelId, sportType, fileName } of activitiesToDownload) {
      const { fileUrl } = await this.corosService.downloadActivityDetail({ labelId, sportType, fileType: '4' });
      await this.downloadFileCommand.handle(fileUrl, outDir, fileName);
    }
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
