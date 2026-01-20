import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Logger } from '@nestjs/common';
import dayjs from 'dayjs';
import { Command, CommandRunner, Option } from 'nest-commander';
import { CorosAPI } from '../coros/coros-api';
import { InvalidParameterError } from './invalid-parameter-error';

type Flags = {
  outDir: string;
};

@Command({ name: 'export-training-schedule', description: 'Export your Coros training schedule for the next 7 days' })
export class ExportTrainingScheduleCommandRunner extends CommandRunner {
  private readonly logger = new Logger(ExportTrainingScheduleCommandRunner.name);
  private readonly corosAPI: CorosAPI;

  constructor(corosAPI: CorosAPI) {
    super();
    this.corosAPI = corosAPI;
  }

  async run(_passedParams: string[], flags: Flags): Promise<void> {
    this.logger.debug(`Running export-training-schedule command with args ${JSON.stringify(flags)}`);
    const { outDir } = flags;

    const startDate = dayjs().startOf('day');
    const endDate = startDate.add(7, 'day');

    await this.corosAPI.login();
    this.logger.debug('Login success');

    const schedule = await this.corosAPI.queryTrainingSchedule({
      startDate: startDate.toDate(),
      endDate: endDate.toDate(),
      supportRestExercise: 1,
    });
    this.logger.debug('Query training schedule success');

    const fileName = `training-schedule-${startDate.format('YYYY-MM-DD')}-to-${endDate.format('YYYY-MM-DD')}.json`;
    const payload: Record<string, unknown> = {
      startDate: startDate.format('YYYY-MM-DD'),
      endDate: endDate.format('YYYY-MM-DD'),
      schedule,
    };

    await writeFile(path.join(outDir, fileName), JSON.stringify(payload, null, 2));
    this.logger.log(`Exported training schedule to ${fileName}`);
  }

  @Option({
    name: 'outDir',
    flags: '-o, --out [outDir]',
    description: 'Output directory',
    required: true,
  })
  parseOutDir(out: string) {
    if (!existsSync(out)) {
      throw new InvalidParameterError('out', out, 'Directory does not exists');
    }

    return out;
  }
}
