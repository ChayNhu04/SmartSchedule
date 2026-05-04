/**
 * Determine which list a schedule will land on, given its start_time
 * (relative to "now"). Mirrors the web helper at web/lib/schedule-bucket.ts
 * and backend filters in `backend/src/schedules/schedules.service.ts`:
 *
 *   - today    : start_time within today's local 00:00–23:59:59
 *   - overdue  : pending AND start_time < now
 *   - upcoming : pending AND start_time >= now
 *
 * Mobile has 2 list tabs (Hôm nay, Sắp tới) plus an overdue stack screen at
 * `/overdue`. Overdue navigates to that screen.
 */
export type ScheduleBucket = "overdue" | "today" | "upcoming";

export interface BucketInfo {
  key: ScheduleBucket;
  /** Vietnamese label for the bucket. */
  label: string;
  /** Path to navigate to after creating a schedule in this bucket. */
  tabPath: "/(tabs)" | "/(tabs)/upcoming" | "/overdue";
}

const BUCKET_INFO: Record<ScheduleBucket, BucketInfo> = {
  overdue: { key: "overdue", label: "Quá hạn", tabPath: "/overdue" },
  today: { key: "today", label: "Hôm nay", tabPath: "/(tabs)" },
  upcoming: { key: "upcoming", label: "Sắp tới", tabPath: "/(tabs)/upcoming" },
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
 * @param now reference time (defaults to current; injectable for tests)
 */
export function bucketForStartTime(
  iso: string,
  now: Date = new Date(),
): BucketInfo {
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
