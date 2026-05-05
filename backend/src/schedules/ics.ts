/**
 * Build a minimal RFC 5545 iCalendar feed from a list of Schedule rows.
 * Không phụ thuộc lib ngoài — chỉ string formatting.
 */
import { Schedule } from './entities/schedule.entity';

const PRODID = '-//SmartSchedule//VI//EN';

function pad(n: number): string {
  return n < 10 ? '0' + n : String(n);
}

function toIcsDate(date: Date): string {
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

/**
 * RFC 5545 yêu cầu line không quá 75 octets — fold bằng CRLF + space.
 */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let i = 0;
  while (i < line.length) {
    const chunkSize = i === 0 ? 75 : 74;
    parts.push(line.slice(i, i + chunkSize));
    i += chunkSize;
  }
  return parts.join('\r\n ');
}

function formatEvent(s: Schedule): string {
  const dtstamp = toIcsDate(new Date());
  const dtstart = toIcsDate(new Date(s.start_time));
  const dtend = s.end_time
    ? toIcsDate(new Date(s.end_time))
    : toIcsDate(new Date(new Date(s.start_time).getTime() + 60 * 60 * 1000));

  const lines = [
    'BEGIN:VEVENT',
    `UID:smartschedule-${s.id}@smartschedule.app`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escapeText(s.title)}`,
  ];
  if (s.description) {
    lines.push(`DESCRIPTION:${escapeText(s.description)}`);
  }
  if (s.priority) {
    // RFC: 1=highest, 5=normal, 9=lowest
    const map: Record<string, number> = { high: 1, normal: 5, low: 9 };
    lines.push(`PRIORITY:${map[s.priority] ?? 5}`);
  }
  if (s.status === 'completed') {
    lines.push('STATUS:COMPLETED');
  } else if (s.status === 'cancelled') {
    lines.push('STATUS:CANCELLED');
  } else {
    lines.push('STATUS:CONFIRMED');
  }
  lines.push('END:VEVENT');
  return lines.map(fold).join('\r\n');
}

export function buildIcs(schedules: Schedule[], calName = 'SmartSchedule'): string {
  const header = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${PRODID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calName)}`,
  ].map(fold);
  const events = schedules.map(formatEvent);
  const footer = ['END:VCALENDAR'];
  return [...header, ...events, ...footer].join('\r\n') + '\r\n';
}
