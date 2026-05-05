/**
 * Work-hours-aware reminder scheduling.
 *
 * Người dùng có thể cấu hình `work_start_hour` và `work_end_hour` (giờ địa phương,
 * 0-23) cùng `timezone` trong settings. Khi reminder rơi ra ngoài khung giờ làm
 * việc, ta dồn nó tới đầu khung kế tiếp thay vì đẩy push ngoài giờ.
 *
 * `work_start_hour === 0 && work_end_hour === 0` được coi là "chưa cấu hình"
 * → không dồn (giữ hành vi cũ).
 */

export interface WorkHoursSettings {
  timezone: string;
  work_start_hour: number;
  work_end_hour: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function hourInTimeZone(date: Date, tz: string): number {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    hour12: false,
  });
  const value = parseInt(fmt.format(date), 10);
  return Number.isFinite(value) ? value % 24 : date.getUTCHours();
}

interface DateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function partsInTimeZone(date: Date, tz: string): DateParts {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '0';
  return {
    year: parseInt(get('year'), 10),
    month: parseInt(get('month'), 10),
    day: parseInt(get('day'), 10),
    hour: parseInt(get('hour'), 10) % 24,
    minute: parseInt(get('minute'), 10),
    second: parseInt(get('second'), 10),
  };
}

/**
 * Trả về `Date` (UTC) tương ứng với mốc Y/M/D h:00 ở timezone `tz`.
 * Dùng kỹ thuật so chênh lệch để xử lý DST đúng đa số trường hợp.
 */
function zonedDate(year: number, month: number, day: number, hour: number, tz: string): Date {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, 0, 0));
  const guessParts = partsInTimeZone(utcGuess, tz);
  const guessAsUtc = Date.UTC(
    guessParts.year,
    guessParts.month - 1,
    guessParts.day,
    guessParts.hour,
    guessParts.minute,
    guessParts.second,
  );
  const offsetMs = guessAsUtc - utcGuess.getTime();
  return new Date(utcGuess.getTime() - offsetMs);
}

export function isInsideWorkHours(now: Date, settings: WorkHoursSettings): boolean {
  const { work_start_hour: ws, work_end_hour: we, timezone } = settings;
  if (!isWorkHoursConfigured(settings)) return true;
  const h = hourInTimeZone(now, timezone);
  return h >= ws && h < we;
}

export function isWorkHoursConfigured(settings: WorkHoursSettings): boolean {
  const { work_start_hour: ws, work_end_hour: we } = settings;
  if (ws === 0 && we === 0) return false;
  if (ws >= we) return false;
  if (ws < 0 || ws > 23 || we < 0 || we > 23) return false;
  return true;
}

/**
 * Mốc UTC ứng với "ngày làm việc kế tiếp" — tức `work_start_hour:00` ở timezone
 * người dùng. Nếu hôm nay chưa tới giờ làm thì trả về hôm nay; ngược lại trả
 * về sáng hôm sau.
 */
export function nextWorkStart(now: Date, settings: WorkHoursSettings): Date {
  if (!isWorkHoursConfigured(settings)) return now;
  const tz = settings.timezone;
  const local = partsInTimeZone(now, tz);
  const todayStart = zonedDate(local.year, local.month, local.day, settings.work_start_hour, tz);
  if (todayStart.getTime() > now.getTime()) return todayStart;
  const tomorrow = new Date(now.getTime() + DAY_MS);
  const t = partsInTimeZone(tomorrow, tz);
  return zonedDate(t.year, t.month, t.day, settings.work_start_hour, tz);
}
