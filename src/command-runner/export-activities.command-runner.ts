import { existsSync } from 'node:fs';
import { Logger } from '@nestjs/common';
import dayjs from 'dayjs';
import { Command, CommandRunner, Option } from 'nest-commander';
import { DownloadFile } from '../core/download-file.service';
import { CorosAPI } from '../coros/coros-api';
import { DefaultFileType, FileTypeKeys, getFileTypeFromKey, isValidFileType } from '../coros/file-type';
import { InvalidParameterError } from './invalid-parameter-error';

type Flags = {
  outDir: string;
  fileType: { key: string; value: string } | string;
  from: Date;
  to: Date;
};

@Command({ name: 'export-activities', description: 'Bulk export your Coros activities' })
export class ExportActivitiesCommandRunner extends CommandRunner {
  private readonly logger = new Logger(ExportActivitiesCommandRunner.name);

  constructor(
    private readonly downloadFileCommand: DownloadFile,
    private readonly corosService: CorosAPI,
  ) {
    super();
  }

  async run(_passedParams: string[], { outDir, fileType: fileTypeArgs, from, to }: Flags): Promise<void> {
    const fileType = typeof fileTypeArgs === 'string' ? this.parseFileType(fileTypeArgs) : fileTypeArgs;
    this.logger.debug(`Running export-activities command with args ${JSON.stringify({ outDir, fileType, from, to })}`);

    await this.corosService.login();
    this.logger.debug('Login success');

    const { activities } = await this.corosService.queryActivities({ from, to });
    this.logger.debug('Query activities success');

    const activitiesToDownload = activities.map((it) => {
      const activityDate = dayjs(String(it.date), 'YYYYMMDD');

      return {
        labelId: it.labelId,
        sportType: it.sportType,
        fileName: `${activityDate.format('YYYY-MM-DD')} ${it.name.trim()} ${it.labelId}.${fileType.key}`,
      };
    });

    for (const { labelId, sportType, fileName } of activitiesToDownload) {
      const { fileUrl } = await this.corosService.downloadActivityDetail({
        labelId,
        sportType,
        fileType: fileType.value,
      });
      await this.downloadFileCommand.handle(fileUrl, outDir, fileName);
      this.logger.debug(`Downloading ${fileName} success`);
    }
  }

  @Option({
    name: 'outDir',
    flags: '-o, --out [outDir]',
    description: 'Output directory',
    required: true,
  })
  parseOutDir(out: string) {
    if (!existsSync(out)) {
      throw new InvalidParameterError('out', `${out} directory does not exists`);
    }

    return out;
  }

  @Option({
    name: 'fileType',
    flags: '--exportType <fileType>',
    choices: FileTypeKeys,
    description: 'Export data type',
    defaultValue: DefaultFileType.key,
    required: false,
  })
  parseFileType(fileType: string): { key: string; value: string } {
    if (!isValidFileType(fileType)) {
      throw new InvalidParameterError('exportType', `Must be one of: ${FileTypeKeys.join(', ')}.`);
    }

    return getFileTypeFromKey(fileType);
  }

  @Option({
    name: 'from',
    flags: '--fromDate <from>',
    description: 'Export activities created after this date (inclusive). Format must be YYYY-MM-DD',
    required: false,
  })
  parseFrom(from: string): Date {
    const maybeDate = dayjs(from, 'YYYY-MM-DD', true);
    if (!maybeDate.isValid()) {
      throw new InvalidParameterError('fromDate', 'Format must be YYYY-MM-DD');
    }

    return maybeDate.toDate();
  }

  @Option({
    name: 'to',
    flags: '--toDate <to>',
    description: 'Export activities created before this date (inclusive). Format must be YYYY-MM-DD',
    required: false,
  })
  parseTo(to: string): Date {
    const maybeDate = dayjs(to, 'YYYY-MM-DD', true);
    if (!maybeDate.isValid()) {
      throw new InvalidParameterError('toDate', 'Format must be YYYY-MM-DD');
    }

    return maybeDate.toDate();
  }
}
