import dayjs from 'dayjs';
import { formatDistance } from '../../core/format-distance';
import { formatDuration } from '../../core/format-duration';
import type { TrainingScheduleEntity, TrainingScheduleProgram } from './query-training-schedule.request';

type LocaleMap = Record<string, string>;

export const resolveSummary = (
  entity: TrainingScheduleEntity,
  program: TrainingScheduleProgram | undefined,
  localeMap: LocaleMap,
): string => {
  if (program?.name) {
    return localeMap[program.name] ?? program.name;
  }

  if (entity.sportData?.name) {
    return entity.sportData.name;
  }

  return 'Training';
};

export const resolveOverview = (program: TrainingScheduleProgram | undefined, localeMap: LocaleMap): string => {
  if (!program?.overview) {
    return '';
  }

  return localeMap[program.overview] ?? program.overview;
};

export const formatPlannedLength = (
  program: TrainingScheduleProgram | undefined,
  entity: TrainingScheduleEntity,
): string => {
  const distance = program?.distance ?? entity.sportData?.distance;
  if (distance && distance > 0) {
    return formatDistance(distance);
  }

  const duration = program?.duration ?? entity.sportData?.duration;
  if (duration && duration > 0) {
    return formatDuration(duration);
  }

  return '';
};

export const resolveDurationSeconds = (
  program: TrainingScheduleProgram | undefined,
  entity: TrainingScheduleEntity,
): number | undefined => {
  if (program?.duration && program.duration > 0) {
    return program.duration;
  }

  if (entity.sportData?.duration && entity.sportData.duration > 0) {
    return entity.sportData.duration;
  }

  return undefined;
};

export const resolvePlannedDate = (entity: TrainingScheduleEntity): dayjs.Dayjs | null => {
  const happenDay = entity.happenDay ?? entity.sportData?.happenDay;
  const happenDate = happenDay ? dayjs(happenDay, 'YYYYMMDD', true) : null;

  if (happenDate?.isValid()) {
    return happenDate;
  }

  return null;
};
