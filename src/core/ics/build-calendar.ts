import dayjs from 'dayjs';
import type { TrainingStart } from '../../coros/training-schedule/parse-training-start';
import { escapeText } from './escape-text';
import { foldLine } from './fold-line';

export type CalendarEvent = {
  uid: string;
  date: dayjs.Dayjs;
  summary: string;
  description: string;
  durationSeconds?: number;
};

export const buildCalendar = (
  events: CalendarEvent[],
  trainingStart: TrainingStart | undefined,
  nowStamp?: string,
): string => {
  const lines: string[] = [];
  const addLine = (line: string) => {
    const folded = foldLine(line);
    lines.push(...folded);
  };

  addLine('BEGIN:VCALENDAR');
  addLine('VERSION:2.0');
  addLine('PRODID:-//coros-api//training-schedule//EN');
  addLine('CALSCALE:GREGORIAN');
  addLine('METHOD:PUBLISH');

  const stamp = nowStamp ?? dayjs().format('YYYYMMDDTHHmmss');
  for (const event of events) {
    addLine('BEGIN:VEVENT');
    addLine(`UID:${escapeText(event.uid)}`);
    addLine(`DTSTAMP:${stamp}`);
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
    addLine(`SUMMARY:${escapeText(event.summary)}`);
    if (event.description) {
      addLine(`DESCRIPTION:${escapeText(event.description)}`);
    }
    addLine('END:VEVENT');
  }

  addLine('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
};
