import dayjs from 'dayjs';
import { Command, CommandRunner, Option } from 'nest-commander';
import { DownloadFileCommand } from '../service/download-file.command';
import { CorosAPI } from '../coros/coros-api';
import { DEFAULT_FILE_TYPE, parseReadableFileType, READABLE_FILE_TYPE, ReadableFileType } from '../coros/file-type';

type Flags = {
  outDir: string;
  fileType: ReadableFileType;
};

@Command({ name: 'export-activities', description: 'Bulk export your Coros activities' })
export class ExportActivitiesCommandRunner extends CommandRunner {
  constructor(
    private readonly downloadFileCommand: DownloadFileCommand,
    private readonly corosService: CorosAPI,
  ) {
    super();
  }

  async run(_passedParams: string[], { outDir, fileType }: Flags): Promise<void> {
    await this.corosService.login();

    const activities = await this.corosService.queryActivities({ size: 100, page: 1 });
    const activitiesToDownload = activities.dataList.map((it) => {
      const activityDate = dayjs(String(it.date), 'YYYYMMDD');

      return {
        labelId: it.labelId,
        sportType: it.sportType,
        fileName: `${activityDate.format('YYYY-MM-DD')} ${it.name.trim()} ${it.labelId}.${fileType}`,
      };
    });

    for (const { labelId, sportType, fileName } of activitiesToDownload) {
      const { fileUrl } = await this.corosService.downloadActivityDetail({
        labelId,
        sportType,
        fileType: parseReadableFileType(fileType),
      });
      await this.downloadFileCommand.handle(fileUrl, outDir, fileName);
    }
  }

  @Option({
    name: 'outDir',
    flags: '-o, --out [outDir]',
    description: 'Output directory',
    required: true,
  })
  parseOutDir(out: string) {
    return out;
  }

  @Option({
    name: 'fileType',
    flags: '-t, --type <fileType>',
    choices: READABLE_FILE_TYPE,
    description: 'Export data type',
    defaultValue: DEFAULT_FILE_TYPE,
    required: false,
  })
  parseFileType(fileType: ReadableFileType): ReadableFileType {
    return fileType;
  }
}
