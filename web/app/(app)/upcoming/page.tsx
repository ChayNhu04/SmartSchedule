"use client";

import { useQuery } from "@tanstack/react-query";
import type { Schedule } from "@smartschedule/shared";
import { ScheduleList } from "@/components/schedule/schedule-list";
import { api } from "@/lib/api";

export default function UpcomingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["schedules", "upcoming"],
    queryFn: async () =>
      (await api.get<Schedule[]>("/schedules/upcoming?limit=50")).data,
  });

  return (
    <ScheduleList
      title="Sắp tới"
      description="50 lịch pending sắp tới gần nhất"
      schedules={data ?? []}
      loading={isLoading}
    />
  );
}
