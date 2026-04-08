import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import type { CalendarEvent } from './build-calendar';
import { buildCalendar } from './build-calendar';

const NOW_STAMP = '20260407T100000';

const makeEvent = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => ({
  uid: 'test-uid-1',
  date: dayjs('2026-04-08'),
  summary: 'Easy Run',
  description: '7.5 km',
  ...overrides,
});

describe('buildCalendar', () => {
  it('produces a valid VCALENDAR with no events when array is empty', () => {
    const result = buildCalendar([], undefined, NOW_STAMP);
    expect(result).toContain('BEGIN:VCALENDAR');
    expect(result).toContain('VERSION:2.0');
    expect(result).toContain('PRODID:-//coros-api//training-schedule//EN');
    expect(result).toContain('CALSCALE:GREGORIAN');
    expect(result).toContain('METHOD:PUBLISH');
    expect(result).toContain('END:VCALENDAR');
    expect(result).not.toContain('BEGIN:VEVENT');
  });

  it('uses CRLF line endings', () => {
    const result = buildCalendar([], undefined, NOW_STAMP);
    const lines = result.split('\r\n');
    expect(lines[0]).toBe('BEGIN:VCALENDAR');
    // Last element after final CRLF is empty string
    expect(lines.at(-1)).toBe('');
  });

  it('produces all-day events when trainingStart is undefined', () => {
    const result = buildCalendar([makeEvent()], undefined, NOW_STAMP);
    expect(result).toContain('DTSTART;VALUE=DATE:20260408');
    expect(result).toContain('DTEND;VALUE=DATE:20260409');
    expect(result).not.toMatch(/DTSTART:\d{8}T/);
  });

  it('produces timed events when trainingStart is provided', () => {
    const event = makeEvent({ durationSeconds: 2700 });
    const result = buildCalendar([event], { hour: 7, minute: 30 }, NOW_STAMP);
    expect(result).toContain('DTSTART:20260408T073000');
    // 2700s = 45min -> 07:30 + 00:45 = 08:15
    expect(result).toContain('DTEND:20260408T081500');
    expect(result).not.toContain('DTSTART;VALUE=DATE:');
  });

  it('sets DTEND equal to DTSTART when durationSeconds is 0 or missing', () => {
    const event = makeEvent({ durationSeconds: undefined });
    const result = buildCalendar([event], { hour: 9, minute: 0 }, NOW_STAMP);
    expect(result).toContain('DTSTART:20260408T090000');
    expect(result).toContain('DTEND:20260408T090000');
  });

  it('includes SUMMARY and DESCRIPTION', () => {
    const result = buildCalendar([makeEvent()], undefined, NOW_STAMP);
    expect(result).toContain('SUMMARY:Easy Run');
    expect(result).toContain('DESCRIPTION:7.5 km');
  });

  it('omits DESCRIPTION when empty', () => {
    const event = makeEvent({ description: '' });
    const result = buildCalendar([event], undefined, NOW_STAMP);
    expect(result).not.toContain('DESCRIPTION:');
  });

  it('includes DTSTAMP with the provided nowStamp', () => {
    const result = buildCalendar([makeEvent()], undefined, NOW_STAMP);
    expect(result).toContain(`DTSTAMP:${NOW_STAMP}`);
  });

  it('renders multiple events', () => {
    const events = [
      makeEvent({ uid: 'e1', summary: 'Run 1' }),
      makeEvent({ uid: 'e2', summary: 'Run 2', date: dayjs('2026-04-09') }),
    ];
    const result = buildCalendar(events, undefined, NOW_STAMP);
    const eventCount = (result.match(/BEGIN:VEVENT/g) ?? []).length;
    expect(eventCount).toBe(2);
    expect(result).toContain('SUMMARY:Run 1');
    expect(result).toContain('SUMMARY:Run 2');
  });
});
