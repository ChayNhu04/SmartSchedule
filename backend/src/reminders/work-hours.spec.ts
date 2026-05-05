import {
  isInsideWorkHours,
  isWorkHoursConfigured,
  nextWorkStart,
  WorkHoursSettings,
} from './work-hours';

const VN: WorkHoursSettings = {
  timezone: 'Asia/Ho_Chi_Minh',
  work_start_hour: 9,
  work_end_hour: 18,
};

const UTC: WorkHoursSettings = {
  timezone: 'UTC',
  work_start_hour: 9,
  work_end_hour: 18,
};

const DISABLED: WorkHoursSettings = {
  timezone: 'Asia/Ho_Chi_Minh',
  work_start_hour: 0,
  work_end_hour: 0,
};

describe('isWorkHoursConfigured', () => {
  it('coi 0/0 là chưa cấu hình', () => {
    expect(isWorkHoursConfigured(DISABLED)).toBe(false);
  });

  it('coi 9/18 là cấu hình hợp lệ', () => {
    expect(isWorkHoursConfigured(VN)).toBe(true);
  });

  it('reject khi start >= end', () => {
    expect(isWorkHoursConfigured({ ...VN, work_start_hour: 18, work_end_hour: 9 })).toBe(false);
  });
});

describe('isInsideWorkHours', () => {
  it('luôn true khi chưa cấu hình', () => {
    const t = new Date('2026-05-02T22:30:00Z');
    expect(isInsideWorkHours(t, DISABLED)).toBe(true);
  });

  it('UTC 10:00 trong khung 9-18 UTC', () => {
    expect(isInsideWorkHours(new Date('2026-05-02T10:00:00Z'), UTC)).toBe(true);
  });

  it('UTC 19:00 ngoài khung 9-18 UTC', () => {
    expect(isInsideWorkHours(new Date('2026-05-02T19:00:00Z'), UTC)).toBe(false);
  });

  it('UTC 02:00 = VN 09:00, đang đúng đầu khung VN', () => {
    expect(isInsideWorkHours(new Date('2026-05-02T02:00:00Z'), VN)).toBe(true);
  });

  it('UTC 11:30 = VN 18:30, ngoài khung VN', () => {
    expect(isInsideWorkHours(new Date('2026-05-02T11:30:00Z'), VN)).toBe(false);
  });
});

describe('nextWorkStart', () => {
  it('giữ nguyên when not configured', () => {
    const now = new Date('2026-05-02T22:00:00Z');
    expect(nextWorkStart(now, DISABLED).toISOString()).toBe(now.toISOString());
  });

  it('VN 04:00 sáng → dồn về VN 09:00 cùng ngày (UTC 02:00)', () => {
    // 04:00 VN = 21:00 UTC ngày trước (May 1)
    const now = new Date('2026-05-01T21:00:00Z');
    const next = nextWorkStart(now, VN);
    expect(next.toISOString()).toBe('2026-05-02T02:00:00.000Z');
  });

  it('VN 20:00 tối → dồn về VN 09:00 sáng hôm sau (UTC 02:00 ngày kế)', () => {
    // 20:00 VN ngày 2/5 = 13:00 UTC ngày 2/5
    const now = new Date('2026-05-02T13:00:00Z');
    const next = nextWorkStart(now, VN);
    expect(next.toISOString()).toBe('2026-05-03T02:00:00.000Z');
  });

  it('UTC giữa khung 9-18 → trả về 9h hôm sau', () => {
    const now = new Date('2026-05-02T12:00:00Z'); // 12:00 UTC trong khung
    const next = nextWorkStart(now, UTC);
    // Trong khung => không cần defer, nhưng hàm vẫn trả 9h kế tiếp.
    // Do hôm nay 9h đã qua → 9h ngày mai.
    expect(next.toISOString()).toBe('2026-05-03T09:00:00.000Z');
  });
});
