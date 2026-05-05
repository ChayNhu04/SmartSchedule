import { buildIcs } from './ics';
import { Schedule } from './entities/schedule.entity';

function fakeSchedule(over: Partial<Schedule> = {}): Schedule {
  return {
    id: 1,
    user_id: 'u1',
    title: 'Họp scrum',
    description: 'Daily 9h',
    start_time: new Date('2026-05-02T09:00:00.000Z'),
    end_time: new Date('2026-05-02T09:30:00.000Z'),
    priority: 'normal',
    status: 'pending',
    item_type: 'meeting',
    recurrence_type: 'none',
    recurrence_interval: 1,
    recurrence_until: null,
    recurrence_parent_id: null,
    remind_at: null,
    is_reminded: false,
    acknowledged_at: null,
    end_notified_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...over,
  } as unknown as Schedule;
}

describe('buildIcs', () => {
  it('bao bọc bằng VCALENDAR và CRLF line endings', () => {
    const ics = buildIcs([fakeSchedule()]);
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('PRODID:-//SmartSchedule//VI//EN');
    expect(ics).toContain('VERSION:2.0');
  });

  it('SUMMARY có escape ký tự đặc biệt', () => {
    const ics = buildIcs([
      fakeSchedule({ title: 'A, B; C\nD' as string }),
    ]);
    expect(ics).toContain('SUMMARY:A\\, B\\; C\\nD');
  });

  it('có DTSTART/DTEND format UTC', () => {
    const ics = buildIcs([fakeSchedule()]);
    expect(ics).toContain('DTSTART:20260502T090000Z');
    expect(ics).toContain('DTEND:20260502T093000Z');
  });

  it('khi không có end_time, default 1 giờ', () => {
    const s = fakeSchedule({ end_time: null as unknown as Date });
    const ics = buildIcs([s]);
    expect(ics).toContain('DTEND:20260502T100000Z');
  });

  it('priority được map về số', () => {
    expect(buildIcs([fakeSchedule({ priority: 'high' })])).toContain('PRIORITY:1');
    expect(buildIcs([fakeSchedule({ priority: 'normal' })])).toContain('PRIORITY:5');
    expect(buildIcs([fakeSchedule({ priority: 'low' })])).toContain('PRIORITY:9');
  });

  it('status hoàn thành thành COMPLETED', () => {
    expect(buildIcs([fakeSchedule({ status: 'completed' })])).toContain('STATUS:COMPLETED');
    expect(buildIcs([fakeSchedule({ status: 'cancelled' })])).toContain('STATUS:CANCELLED');
    expect(buildIcs([fakeSchedule({ status: 'pending' })])).toContain('STATUS:CONFIRMED');
  });

  it('UID duy nhất theo schedule id', () => {
    const ics = buildIcs([fakeSchedule({ id: 42 })]);
    expect(ics).toContain('UID:smartschedule-42@smartschedule.app');
  });

  it('list trống vẫn ra file iCal hợp lệ', () => {
    const ics = buildIcs([]);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).not.toContain('BEGIN:VEVENT');
  });

  it('line dài quá 75 ký tự được fold theo RFC 5545', () => {
    const longTitle = 'A'.repeat(200);
    const ics = buildIcs([fakeSchedule({ title: longTitle })]);
    const summaryLine = ics
      .split('\r\n')
      .findIndex((l) => l.startsWith('SUMMARY:'));
    expect(summaryLine).toBeGreaterThan(-1);
    // Fold: line tiếp theo phải bắt đầu bằng space
    const nextLine = ics.split('\r\n')[summaryLine + 1];
    expect(nextLine.startsWith(' ')).toBe(true);
  });
});
