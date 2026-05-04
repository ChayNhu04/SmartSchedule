/**
 * Determine which list page a schedule will land on, given its start_time
 * (relative to "now"). Mirrors backend logic in
 * `backend/src/schedules/schedules.service.ts`:
 *
 *   - /today    : start_time within today's local 00:00–23:59:59
 *   - /overdue  : pending AND start_time < now
 *   - /upcoming : pending AND start_time >= now
 *
 * For the toast we surface the most-relevant single bucket so the user knows
 * where to look. Newly-created schedules default to status='pending', so we
 * pick "overdue" over "today" when start_time is earlier today (e.g.
 * "yesterday at 9am" still surfaces as overdue, "10am today" when now is 11am
 * is overdue, "8pm today" when now is 11am is today, "next week" is upcoming).
 */
export type ScheduleBucket = "overdue" | "today" | "upcoming";

export interface BucketInfo {
  key: ScheduleBucket;
  /** Vietnamese label for the bucket (used in toast action button). */
  label: string;
  /** Path of the page that lists this bucket. */
  path: "/overdue" | "/today" | "/upcoming";
}

const BUCKET_INFO: Record<ScheduleBucket, BucketInfo> = {
  overdue: { key: "overdue", label: "Quá hạn", path: "/overdue" },
  today: { key: "today", label: "Hôm nay", path: "/today" },
  upcoming: { key: "upcoming", label: "Sắp tới", path: "/upcoming" },
};

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Pick the most-relevant bucket for a schedule's start_time.
 *
 * @param iso ISO-8601 start_time (e.g. "2026-05-02T09:00:00.000Z")
 * @param now reference time (defaults to current time; injectable for tests)
 */
export function bucketForStartTime(iso: string, now: Date = new Date()): BucketInfo {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return BUCKET_INFO.upcoming;
  }
  if (d.getTime() < now.getTime()) {
    return BUCKET_INFO.overdue;
  }
  if (isSameLocalDay(d, now)) {
    return BUCKET_INFO.today;
  }
  return BUCKET_INFO.upcoming;
}

/**
 * Returns true if the schedule (with given start_time) would actually appear
 * on `pathname` if the user is on that page right now. Used to decide whether
 * to suppress the "go to other tab" suggestion (when the schedule is already
 * on screen we just confirm with a simple toast).
 */
export function visibleOnPath(
  pathname: string | null | undefined,
  iso: string,
  now: Date = new Date(),
): boolean {
  if (!pathname) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  if (pathname === "/today") return isSameLocalDay(d, now);
  if (pathname === "/overdue") return d.getTime() < now.getTime();
  if (pathname === "/upcoming") return d.getTime() >= now.getTime();
  return false;
}
