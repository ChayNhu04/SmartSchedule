"use client";

import { useQuery } from "@tanstack/react-query";
import type { Schedule } from "@smartschedule/shared";
import { ScheduleList } from "@/components/schedule/schedule-list";
import { api } from "@/lib/api";

export default function TodayPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["schedules", "today"],
    queryFn: async () => (await api.get<Schedule[]>("/schedules/today")).data,
  });

  return (
    <ScheduleList
      title="Lịch hôm nay"
      description="Toàn bộ lịch trong ngày hôm nay"
      schedules={data ?? []}
      loading={isLoading}
      emptyMessage="🎉 Hôm nay không có lịch nào — tận hưởng nhé!"
    />
  );
}
