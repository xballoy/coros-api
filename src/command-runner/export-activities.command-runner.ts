import { Logger } from '@nestjs/common';
import dayjs from 'dayjs';
import { Command, CommandRunner, Option } from 'nest-commander';
import { DownloadFile } from '../core/download-file.service';
import { InvalidParameterError } from '../core/invalid-parameter-error';
import { parseDate } from '../core/parse-date';
import { parseOutDir } from '../core/parse-out-dir';
import { CorosAPI } from '../coros/coros-api';
import { DefaultFileType, FileTypeKeys, getFileTypeFromKey, isValidFileTypeKey } from '../coros/file-type';
import { DefaultSportType, getSportTypeValueFromKey, isValidSportTypeKey, SportTypeKeys } from '../coros/sport-type';

type FileTypeFlag = { key: string; value: string };
type SportTypesFlag = string[];
type Flags = {
  outDir: string;
  fileType: FileTypeFlag;
  sportTypes: SportTypesFlag;
  from: Date;
  to: Date;
};

@Command({ name: 'export-activities', description: 'Bulk export your Coros activities' })
export class ExportActivitiesCommandRunner extends CommandRunner {
  private readonly logger = new Logger(ExportActivitiesCommandRunner.name);
  private readonly downloadFileCommand: DownloadFile;
  private readonly corosService: CorosAPI;

  constructor(downloadFileCommand: DownloadFile, corosService: CorosAPI) {
    super();
    this.corosService = corosService;
    this.downloadFileCommand = downloadFileCommand;
  }

  async run(_passedParams: string[], flags: Flags): Promise<void> {
    this.logger.debug(`Running export-activities command with args ${JSON.stringify(flags)}`);
    const { outDir, fileType, from, to, sportTypes } = flags;

    await this.corosService.login();
    this.logger.debug('Login success');

    const { activities } = await this.corosService.queryActivities({
      from,
      to,
      sportTypes,
    });
    this.logger.debug('Query activities success');

    const activitiesToDownload = activities.map((it) => {
      const activityDate = dayjs(String(it.date), 'YYYYMMDD');
      const activityName = it.name?.trim() || 'Activity';

      return {
        labelId: it.labelId,
        sportType: it.sportType,
        fileName: `${activityDate.format('YYYY-MM-DD')} ${activityName} ${it.labelId}.${fileType.key}`,
      };
    });

    for (const { labelId, sportType, fileName } of activitiesToDownload) {
      try {
        const { fileUrl } = await this.corosService.downloadActivityDetail({
          labelId,
          sportType,
          fileType: fileType.value,
        });
        await this.downloadFileCommand.handle(fileUrl, outDir, fileName);
        this.logger.debug(`Downloading ${fileName} success`);
      } catch {
        this.logger.error(`Downloading ${fileName} failed`);
      }
    }
  }

  @Option({
    name: 'outDir',
    flags: '-o, --out [outDir]',
    description: 'Output directory',
    required: true,
  })
  parseOutDir(out: string) {
    return parseOutDir(out);
  }

  @Option({
    name: 'fileType',
    flags: '--exportType <fileType>',
    choices: FileTypeKeys,
    description: 'Export data type',
    defaultValue: DefaultFileType satisfies FileTypeFlag,
    required: false,
  })
  parseFileType(fileType: string): FileTypeFlag {
    if (!isValidFileTypeKey(fileType)) {
      throw new InvalidParameterError('exportType', fileType, `Must be one of: ${FileTypeKeys.join(', ')}.`);
    }

    return getFileTypeFromKey(fileType);
  }

  @Option({
    name: 'sportTypes',
    flags: '--exportSportTypes <sportTypes>',
    choices: SportTypeKeys,
    description: 'Export sport types',
    defaultValue: [DefaultSportType.value] satisfies SportTypesFlag,
    required: false,
  })
  parseSportType(sportTypes: string): SportTypesFlag {
    const invalidSportTypes = sportTypes.split(',').filter((sportType) => !isValidSportTypeKey(sportType));
    if (invalidSportTypes.length) {
      throw new InvalidParameterError(
        'sportType',
        invalidSportTypes.join(', '),
        `Must be comma separated values of: ${SportTypeKeys.join(', ')}.`,
      );
    }

    return sportTypes.split(',').filter(isValidSportTypeKey).map(getSportTypeValueFromKey);
  }

  @Option({
    name: 'from',
    flags: '--fromDate <from>',
    description: 'Export activities created after this date (inclusive). Format must be YYYY-MM-DD',
    required: false,
  })
  parseFrom(from: string): Date {
    return parseDate(from, 'fromDate');
  }

  @Option({
    name: 'to',
    flags: '--toDate <to>',
    description: 'Export activities created before this date (inclusive). Format must be YYYY-MM-DD',
    required: false,
  })
  parseTo(to: string): Date {
    return parseDate(to, 'toDate');
  }
}
