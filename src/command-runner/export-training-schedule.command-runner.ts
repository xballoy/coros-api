import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Logger } from '@nestjs/common';
import dayjs from 'dayjs';
import { Command, CommandRunner, Option } from 'nest-commander';
import { CorosAPI } from '../coros/coros-api';
import type {
  QueryTrainingScheduleData,
  TrainingScheduleEntity,
  TrainingScheduleProgram,
} from '../coros/training-schedule/query-training-schedule.request';
import { InvalidParameterError } from './invalid-parameter-error';

type Flags = {
  outDir: string;
  trainingStart?: TrainingStart;
};

type LocaleMap = Record<string, string>;
type TrainingStart = {
  hour: number;
  minute: number;
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

    const localeMap = await this.fetchLocaleMap();
    const events = this.buildScheduleEvents(schedule, localeMap, flags.trainingStart);
    const calendar = this.buildCalendar(events, flags.trainingStart);
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
    if (!existsSync(out)) {
      throw new InvalidParameterError('out', out, 'Directory does not exists');
    }

    return out;
  }

  @Option({
    name: 'trainingStart',
    flags: '--training-start <time>',
    description: 'Start time for training events (HH:mm)',
    required: false,
  })
  parseTrainingStart(value: string): TrainingStart {
    const parsed = dayjs(value, 'HH:mm', true);
    if (!parsed.isValid()) {
      throw new InvalidParameterError('training-start', value, 'Format must be HH:mm');
    }

    return { hour: parsed.hour(), minute: parsed.minute() };
  }

  private async fetchLocaleMap(): Promise<LocaleMap> {
    const url = 'https://static.coros.com/locale/coros-traininghub-v2/en-US.prod.js';
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch locale map: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    let payload: string | undefined;
    const marker = 'window.en_US=';
    const markerIndex = text.indexOf(marker);
    if (markerIndex !== -1) {
      payload = text.slice(markerIndex + marker.length).trim();
    } else {
      const match = text.match(/window\.en_US\s*=\s*(\{[\s\S]*\})/);
      if (match) {
        payload = match[1];
      }
    }

    if (!payload) {
      throw new Error('Locale map did not contain expected window.en_US payload');
    }

    if (payload.endsWith(';')) {
      payload = payload.slice(0, -1);
    }

    return JSON.parse(payload) as LocaleMap;
  }

  private buildScheduleEvents(
    schedule: QueryTrainingScheduleData,
    localeMap: LocaleMap,
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
        const plannedDate = this.resolvePlannedDate(entity);
        if (!plannedDate) {
          return null;
        }

        const programId = entity.idInPlan ?? entity.planProgramId;
        const program = programsById.get(programId);
        const summary = this.resolveSummary(entity, program, localeMap);
        const overview = this.resolveOverview(program, localeMap);
        const lengthText = this.formatPlannedLength(program, entity);
        const description = [lengthText, overview].filter((value) => value && value.length > 0).join(' - ');
        const durationSeconds = trainingStart ? this.resolveDurationSeconds(program, entity) : undefined;
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

  private resolveSummary(
    entity: TrainingScheduleEntity,
    program: TrainingScheduleProgram | undefined,
    localeMap: LocaleMap,
  ): string {
    if (program?.name) {
      return localeMap[program.name] ?? program.name;
    }

    if (entity.sportData?.name) {
      return entity.sportData.name;
    }

    return 'Training';
  }

  private resolveOverview(program: TrainingScheduleProgram | undefined, localeMap: LocaleMap): string {
    if (!program?.overview) {
      return '';
    }

    return localeMap[program.overview] ?? program.overview;
  }

  private formatPlannedLength(program: TrainingScheduleProgram | undefined, entity: TrainingScheduleEntity): string {
    const distance = program?.distance ?? entity.sportData?.distance;
    if (distance && distance > 0) {
      return this.formatDistance(distance);
    }

    const duration = program?.duration ?? entity.sportData?.duration;
    if (duration && duration > 0) {
      return this.formatDuration(duration);
    }

    return '';
  }

  private resolveDurationSeconds(
    program: TrainingScheduleProgram | undefined,
    entity: TrainingScheduleEntity,
  ): number | undefined {
    if (program?.duration && program.duration > 0) {
      return program.duration;
    }

    if (entity.sportData?.duration && entity.sportData.duration > 0) {
      return entity.sportData.duration;
    }

    return undefined;
  }

  private formatDistance(distance: number): string {
    const kilometers = distance / 100000;
    const rounded = Number.isInteger(kilometers) ? kilometers.toFixed(0) : kilometers.toFixed(1);
    return `${rounded} km`;
  }

  private formatDuration(totalSeconds: number): string {
    const seconds = Math.max(0, Math.round(totalSeconds));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    if (minutes > 0) {
      return `${minutes}m`;
    }

    return `${seconds}s`;
  }

  private resolvePlannedDate(entity: TrainingScheduleEntity): dayjs.Dayjs | null {
    const happenDay = entity.happenDay ?? entity.sportData?.happenDay;
    const happenDate = happenDay ? dayjs(happenDay, 'YYYYMMDD', true) : null;

    if (happenDate?.isValid()) {
      return happenDate;
    }

    return null;
  }

  private buildCalendar(
    events: Array<{
      uid: string;
      date: dayjs.Dayjs;
      summary: string;
      description: string;
      durationSeconds?: number;
    }>,
    trainingStart: TrainingStart | undefined,
  ): string {
    const lines: string[] = [];
    const addLine = (line: string) => {
      const folded = this.foldLine(line);
      lines.push(...folded);
    };

    addLine('BEGIN:VCALENDAR');
    addLine('VERSION:2.0');
    addLine('PRODID:-//coros-api//training-schedule//EN');
    addLine('CALSCALE:GREGORIAN');
    addLine('METHOD:PUBLISH');

    const nowStamp = dayjs().format('YYYYMMDDTHHmmss');
    for (const event of events) {
      addLine('BEGIN:VEVENT');
      addLine(`UID:${this.escapeText(event.uid)}`);
      addLine(`DTSTAMP:${nowStamp}`);
      if (trainingStart) {
        const startDateTime = event.date.hour(trainingStart.hour).minute(trainingStart.minute).second(0).millisecond(0);
        const durationSeconds = Math.max(0, Math.round(event.durationSeconds ?? 0));
        const endDateTime = startDateTime.add(durationSeconds, 'second');
        addLine(`DTSTART:${startDateTime.format('YYYYMMDDTHHmmss')}`);
        addLine(`DTEND:${endDateTime.format('YYYYMMDDTHHmmss')}`);
      } else {
        const startDate = event.date.format('YYYYMMDD');
        const endDate = event.date.add(1, 'day').format('YYYYMMDD');
        addLine(`DTSTART;VALUE=DATE:${startDate}`);
        addLine(`DTEND;VALUE=DATE:${endDate}`);
      }
      addLine(`SUMMARY:${this.escapeText(event.summary)}`);
      if (event.description) {
        addLine(`DESCRIPTION:${this.escapeText(event.description)}`);
      }
      addLine('END:VEVENT');
    }

    addLine('END:VCALENDAR');
    return `${lines.join('\r\n')}\r\n`;
  }

  private foldLine(line: string): string[] {
    const maxLength = 75;
    if (line.length <= maxLength) {
      return [line];
    }

    const segments: string[] = [];
    let remaining = line;
    let isFirst = true;
    while (remaining.length > 0) {
      const chunkSize = isFirst ? maxLength : maxLength - 1;
      segments.push(remaining.slice(0, chunkSize));
      remaining = remaining.slice(chunkSize);
      isFirst = false;
    }

    return segments.map((segment, index) => (index === 0 ? segment : ` ${segment}`));
  }

  private escapeText(value: string): string {
    return value
      .replaceAll('\\', '\\\\')
      .replaceAll(/\r?\n/g, String.raw`\n`)
      .replaceAll(',', String.raw`\,`)
      .replaceAll(';', String.raw`\;`);
  }
}
