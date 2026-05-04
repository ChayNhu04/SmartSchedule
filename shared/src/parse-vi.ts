/**
 * Vietnamese natural-language schedule parser.
 *
 * Parses common Vietnamese phrases like "mai 9h họp scrum" into a structured
 * schedule { title, start_time }. Designed for a "Thêm nhanh" quick-add input
 * on web/mobile. Pure function — no I/O, no timezone tricks beyond the
 * caller's local time.
 *
 * Supported tokens (greedily consumed from the START of the input; whatever
 * remains becomes the title):
 *   - Date: "hôm nay" / "nay" / "ngày mai" / "mai" / "ngày kia" / "mốt" / "kia"
 *           also "dd/mm" or "dd/mm/yyyy" (also "-")
 *   - Time: "9h", "9h30", "9:30", "9 giờ", "9 giờ 30"
 *           plus optional period: "sáng" / "trưa" / "chiều" / "tối" / "đêm"
 *           Period before time also OK: "sáng mai" handled via date; "tối nay" too.
 *   - Period-only (no explicit hour): defaults to a sensible hour
 *           ("sáng" → 9, "trưa" → 12, "chiều" → 14, "tối" → 19, "đêm" → 22)
 *
 * If no date is given and the resulting time is in the past relative to `now`,
 * the result is bumped to tomorrow (with a note added to `inferred`).
 *
 * Diacritic-insensitive: handles "sang"/"sáng", "chieu"/"chiều", etc.
 */

export interface ParsedSchedule {
  title: string;
  start_time: string;
  end_time: string;
  inferred: string[];
}

const RELATIVE_DAY_OFFSET: Record<string, number> = {
  "hôm nay": 0,
  "hom nay": 0,
  nay: 0,
  "ngày mai": 1,
  "ngay mai": 1,
  mai: 1,
  "ngày kia": 2,
  "ngay kia": 2,
  mốt: 2,
  mot: 2,
  kia: 2,
};

const PERIOD_DEFAULT_HOUR: Record<string, number> = {
  sáng: 9,
  sang: 9,
  trưa: 12,
  trua: 12,
  chiều: 14,
  chieu: 14,
  tối: 19,
  toi: 19,
  đêm: 22,
  dem: 22,
};

const AFTERNOON_PERIODS = new Set(["chiều", "chieu", "tối", "toi", "đêm", "dem"]);
const ALL_PERIODS = new Set(Object.keys(PERIOD_DEFAULT_HOUR));

interface PrefixMatch {
  consumed: number;
}

interface DateMatch extends PrefixMatch {
  offset?: number;
  date?: Date;
}

interface TimeMatch extends PrefixMatch {
  hour: number;
  minute: number;
  period?: string;
}

interface PeriodMatch extends PrefixMatch {
  period: string;
}

function lc(s: string | undefined): string {
  return (s ?? "").toLowerCase();
}

function tryDate(tokens: string[], i: number, now: Date): DateMatch | null {
  const t0 = lc(tokens[i]);
  const t1 = lc(tokens[i + 1]);

  if (t0 === "hôm" || t0 === "hom") {
    if (t1 === "nay") return { offset: 0, consumed: 2 };
  }
  if (t0 === "ngày" || t0 === "ngay") {
    if (t1 === "mai") return { offset: 1, consumed: 2 };
    if (t1 === "kia") return { offset: 2, consumed: 2 };
  }

  if (t0 in RELATIVE_DAY_OFFSET) {
    return { offset: RELATIVE_DAY_OFFSET[t0], consumed: 1 };
  }

  // dd/mm or dd-mm or dd/mm/yyyy
  const dmMatch = t0.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?$/);
  if (dmMatch) {
    const day = parseInt(dmMatch[1], 10);
    const month = parseInt(dmMatch[2], 10);
    const yearStr = dmMatch[3];
    const year = yearStr
      ? yearStr.length === 2
        ? 2000 + parseInt(yearStr, 10)
        : parseInt(yearStr, 10)
      : now.getFullYear();
    if (
      day >= 1 &&
      day <= 31 &&
      month >= 1 &&
      month <= 12 &&
      year >= 1900 &&
      year <= 9999
    ) {
      const date = new Date(year, month - 1, day);
      if (!Number.isNaN(date.getTime())) {
        return { date, consumed: 1 };
      }
    }
  }

  return null;
}

function tryPeriod(tokens: string[], i: number): PeriodMatch | null {
  const t = lc(tokens[i]);
  if (t in PERIOD_DEFAULT_HOUR) return { period: t, consumed: 1 };
  return null;
}

function tryTime(tokens: string[], i: number): TimeMatch | null {
  const t0 = tokens[i];
  if (!t0) return null;
  let hour: number | null = null;
  let minute = 0;
  let consumed = 0;

  // "9h", "09h", "9h30", "9h05"
  let m = t0.match(/^(\d{1,2})h(\d{0,2})$/i);
  if (m) {
    hour = parseInt(m[1], 10);
    if (m[2]) minute = parseInt(m[2], 10);
    consumed = 1;
  } else {
    // "9:30", "09:00"
    m = t0.match(/^(\d{1,2}):(\d{2})$/);
    if (m) {
      hour = parseInt(m[1], 10);
      minute = parseInt(m[2], 10);
      consumed = 1;
    } else if (/^\d{1,2}$/.test(t0)) {
      // "9 giờ", "9 giờ 30"
      const next = lc(tokens[i + 1]);
      if (next === "giờ" || next === "gio") {
        hour = parseInt(t0, 10);
        consumed = 2;
        const after = tokens[i + 2];
        if (after && /^\d{1,2}$/.test(after)) {
          minute = parseInt(after, 10);
          consumed = 3;
        }
      }
    }
  }

  if (hour === null) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  // Optional period qualifier AFTER the time
  let period: string | undefined;
  const after = lc(tokens[i + consumed]);
  if (after && after in PERIOD_DEFAULT_HOUR) {
    period = after;
    if (hour < 12 && AFTERNOON_PERIODS.has(period)) {
      hour += 12;
    }
    consumed++;
  }

  return { hour, minute, period, consumed };
}

export interface ParseOptions {
  now?: Date;
  /** Default duration in minutes, applied to end_time. Defaults to 60. */
  durationMinutes?: number;
  /** Default hour when nothing is given. Defaults to 9 (sáng). */
  defaultHour?: number;
}

export function parseScheduleText(
  text: string,
  options: ParseOptions = {},
): ParsedSchedule {
  const now = options.now ?? new Date();
  const durationMinutes = options.durationMinutes ?? 60;
  const defaultHour = options.defaultHour ?? 9;

  const trimmed = text.trim();
  const tokens = trimmed.length === 0 ? [] : trimmed.split(/\s+/);
  const inferred: string[] = [];

  let i = 0;
  let dayOffset: number | null = null;
  let parsedDate: Date | null = null;
  let hour: number | null = null;
  let minute = 0;
  let periodHint: string | null = null;

  // Greedy prefix consumption: try date, period, time in any order until
  // nothing matches.
  let progressed = true;
  while (i < tokens.length && progressed) {
    progressed = false;

    if (dayOffset === null && parsedDate === null) {
      const m = tryDate(tokens, i, now);
      if (m) {
        if (typeof m.offset === "number") dayOffset = m.offset;
        if (m.date) parsedDate = m.date;
        i += m.consumed;
        progressed = true;
        continue;
      }
    }

    if (hour === null) {
      const m = tryTime(tokens, i);
      if (m) {
        hour = m.hour;
        minute = m.minute;
        if (m.period) periodHint = m.period;
        i += m.consumed;
        progressed = true;
        continue;
      }
    }

    if (periodHint === null && hour === null) {
      const m = tryPeriod(tokens, i);
      if (m) {
        periodHint = m.period;
        i += m.consumed;
        progressed = true;
        continue;
      }
    }
  }

  const titleTokens = tokens.slice(i);
  const title = titleTokens.join(" ").trim() || "Lịch mới";

  // Build start_time
  const start = parsedDate ? new Date(parsedDate) : new Date(now);
  if (parsedDate === null && dayOffset !== null) {
    start.setDate(now.getDate() + dayOffset);
  }

  if (hour !== null) {
    start.setHours(hour, minute, 0, 0);
  } else if (periodHint) {
    start.setHours(PERIOD_DEFAULT_HOUR[periodHint], 0, 0, 0);
    inferred.push(
      `Mặc định ${PERIOD_DEFAULT_HOUR[periodHint]}h cho "${periodHint}"`,
    );
  } else {
    start.setHours(defaultHour, 0, 0, 0);
    inferred.push(`Mặc định ${defaultHour}h sáng`);
  }

  // Bump to tomorrow if the resolved time has already passed today and the
  // user didn't specify a date.
  if (
    parsedDate === null &&
    dayOffset === null &&
    start.getTime() <= now.getTime()
  ) {
    start.setDate(start.getDate() + 1);
    inferred.push("Đã qua giờ — chuyển sang ngày mai");
  }

  if (titleTokens.length === 0) {
    inferred.push('Tiêu đề trống — đặt mặc định "Lịch mới"');
  }

  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  return {
    title,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    inferred,
  };
}

// Re-export sets so callers can build hint UIs.
export const VI_PARSE_TOKENS = {
  relativeDays: Object.keys(RELATIVE_DAY_OFFSET),
  periods: Array.from(ALL_PERIODS),
} as const;
