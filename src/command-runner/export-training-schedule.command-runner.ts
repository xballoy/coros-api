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

type LocaleMap = Record<string, string>;
type UnknownRecord = Record<string, unknown>;

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
    const events = this.buildScheduleEvents(schedule, localeMap);
    const calendar = this.buildCalendar(events);
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
      const match = text.match(/window\\.en_US\\s*=\\s*(\\{[\\s\\S]*\\})/);
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
    schedule: unknown,
    localeMap: LocaleMap,
  ): Array<{
    uid: string;
    date: dayjs.Dayjs;
    summary: string;
    description: string;
  }> {
    if (!this.isRecord(schedule)) {
      this.logger.warn('Training schedule response is not an object. No events exported.');
      return [];
    }

    const entities = Array.isArray(schedule.entities)
      ? schedule.entities.filter((entity) => this.isRecord(entity))
      : [];
    const programs = Array.isArray(schedule.programs)
      ? schedule.programs.filter((program) => this.isRecord(program))
      : [];
    const programsById = new Map<string, UnknownRecord>();
    for (const program of programs) {
      const id = this.toStringValue(program.idInPlan);
      if (id) {
        programsById.set(id, program);
      }
    }

    return entities
      .map((entity) => {
        const happenDay = this.toStringValue(entity.happenDay);
        if (!happenDay) {
          return null;
        }

        const date = dayjs(happenDay, 'YYYYMMDD', true);
        if (!date.isValid()) {
          return null;
        }

        const programId = this.toStringValue(entity.planProgramId);
        const program = programId ? programsById.get(programId) : undefined;
        const summary = this.resolveSummary(entity, program, localeMap);
        const overview = this.resolveOverview(program, localeMap);
        const lengthText = this.formatPlannedLength(program, entity);
        const description = [lengthText, overview].filter((value) => value && value.length > 0).join(' - ');
        const uid = this.toStringValue(entity.id) ?? `coros-${happenDay}-${programId ?? 'unknown'}`;

        return {
          uid,
          date,
          summary,
          description,
        };
      })
      .filter((event): event is NonNullable<typeof event> => event !== null)
      .sort((a, b) => a.date.valueOf() - b.date.valueOf());
  }

  private resolveSummary(entity: UnknownRecord, program: UnknownRecord | undefined, localeMap: LocaleMap): string {
    const programName = this.toStringValue(program?.name);
    if (programName) {
      return localeMap[programName] ?? programName;
    }

    const sportData = this.isRecord(entity.sportData) ? entity.sportData : undefined;
    const activityName = this.toStringValue(sportData?.name);
    if (activityName) {
      return activityName;
    }

    return 'Training';
  }

  private resolveOverview(program: UnknownRecord | undefined, localeMap: LocaleMap): string {
    const overview = this.toStringValue(program?.overview);
    if (!overview) {
      return '';
    }

    return localeMap[overview] ?? overview;
  }

  private formatPlannedLength(program: UnknownRecord | undefined, entity: UnknownRecord): string {
    const programDistance = this.toNumber(program?.distance);
    const entityDistance = this.toNumber(this.isRecord(entity.sportData) ? entity.sportData.distance : undefined);
    const distance = programDistance ?? entityDistance;
    if (distance && distance > 0) {
      return this.formatDistance(distance);
    }

    const programDuration = this.toNumber(program?.duration);
    const entityDuration = this.toNumber(this.isRecord(entity.sportData) ? entity.sportData.duration : undefined);
    const duration = programDuration ?? entityDuration;
    if (duration && duration > 0) {
      return this.formatDuration(duration);
    }

    return '';
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

  private buildCalendar(
    events: Array<{ uid: string; date: dayjs.Dayjs; summary: string; description: string }>,
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
      const startDate = event.date.format('YYYYMMDD');
      const endDate = event.date.add(1, 'day').format('YYYYMMDD');
      addLine('BEGIN:VEVENT');
      addLine(`UID:${this.escapeText(event.uid)}`);
      addLine(`DTSTAMP:${nowStamp}`);
      addLine(`DTSTART;VALUE=DATE:${startDate}`);
      addLine(`DTEND;VALUE=DATE:${endDate}`);
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
    while (remaining.length > maxLength) {
      segments.push(remaining.slice(0, maxLength));
      remaining = remaining.slice(maxLength);
    }
    if (remaining.length > 0) {
      segments.push(remaining);
    }

    return segments.map((segment, index) => (index === 0 ? segment : ` ${segment}`));
  }

  private escapeText(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  }

  private isRecord(value: unknown): value is UnknownRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private toStringValue(value: unknown): string | undefined {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
    return undefined;
  }

  private toNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return undefined;
  }
}
