import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import dayjs from 'dayjs';
import { Command, CommandRunner, Option } from 'nest-commander';
import { buildCalendar } from '../core/ics/build-calendar';
import { parseOutDir } from '../core/parse-out-dir';
import { CorosAPI } from '../coros/coros-api';
import { fetchLocaleMap } from '../coros/training-schedule/fetch-locale-map';
import type { TrainingStart } from '../coros/training-schedule/parse-training-start';
import { parseTrainingStart } from '../coros/training-schedule/parse-training-start';
import type {
  QueryTrainingScheduleData,
  TrainingScheduleProgram,
} from '../coros/training-schedule/query-training-schedule.request';
import {
  formatPlannedLength,
  resolveDurationSeconds,
  resolveOverview,
  resolvePlannedDate,
  resolveSummary,
} from '../coros/training-schedule/resolve-training-data';

type Flags = {
  outDir: string;
  trainingStart?: TrainingStart;
};

@Command({ name: 'export-training-schedule', description: 'Export your Coros training schedule for the next 7 days' })
export class ExportTrainingScheduleCommandRunner extends CommandRunner {
  private readonly logger = new Logger(ExportTrainingScheduleCommandRunner.name);
  private readonly corosAPI: CorosAPI;
  private readonly httpService: HttpService;

  constructor(corosAPI: CorosAPI, httpService: HttpService) {
    super();
    this.corosAPI = corosAPI;
    this.httpService = httpService;
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

    const localeMap = await fetchLocaleMap(this.httpService);
    const events = this.buildScheduleEvents(schedule, localeMap, flags.trainingStart);
    const calendar = buildCalendar(events, flags.trainingStart);
    const fileName = `training-schedule-${startDate.format('YYYY-MM-DD')}-to-${endDate.format('YYYY-MM-DD')}.ics`;

    await writeFile(path.join(outDir, fileName), calendar);
    this.logger.log(`Exported training schedule to ${fileName}`);
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
    name: 'trainingStart',
    flags: '--training-start <time>',
    description: 'Start time for training events (HH:mm)',
    required: false,
  })
  parseTrainingStart(value: string): TrainingStart {
    return parseTrainingStart(value);
  }

  private buildScheduleEvents(
    schedule: QueryTrainingScheduleData,
    localeMap: Record<string, string>,
    trainingStart: TrainingStart | undefined,
  ): Array<{
    uid: string;
    date: dayjs.Dayjs;
    summary: string;
    description: string;
    durationSeconds?: number;
  }> {
    const programsById = new Map<string, TrainingScheduleProgram>();
    for (const program of schedule.programs) {
      programsById.set(program.idInPlan, program);
    }

    return schedule.entities
      .map((entity) => {
        const plannedDate = resolvePlannedDate(entity);
        if (!plannedDate) {
          return null;
        }

        const programId = entity.idInPlan ?? entity.planProgramId;
        const program = programsById.get(programId);
        const summary = resolveSummary(entity, program, localeMap);
        const overview = resolveOverview(program, localeMap);
        const lengthText = formatPlannedLength(program, entity);
        const description = [lengthText, overview].filter((value) => value && value.length > 0).join(' - ');
        const durationSeconds = trainingStart ? resolveDurationSeconds(program, entity) : undefined;
        if (trainingStart && durationSeconds === undefined) {
          this.logger.warn(
            `Missing duration for training on ${plannedDate.format('YYYY-MM-DD')}: ` + `${summary || 'Training'}`,
          );
        }

        return {
          uid: entity.id ?? `coros-${plannedDate.format('YYYYMMDD')}-${programId ?? 'unknown'}`,
          date: plannedDate,
          summary,
          description,
          durationSeconds,
        };
      })
      .filter((event): event is NonNullable<typeof event> => event !== null)
      .sort((a, b) => a.date.valueOf() - b.date.valueOf());
  }
}
