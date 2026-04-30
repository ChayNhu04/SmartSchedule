"use client";

import { useQuery } from "@tanstack/react-query";
import type { Schedule } from "@smartschedule/shared";
import { ScheduleList } from "@/components/schedule/schedule-list";
import { api } from "@/lib/api";

export default function OverduePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["schedules", "overdue"],
    queryFn: async () => (await api.get<Schedule[]>("/schedules/overdue")).data,
  });

  return (
    <ScheduleList
      title="Lịch quá hạn"
      description="Lịch pending nhưng đã qua thời gian bắt đầu"
      schedules={data ?? []}
      loading={isLoading}
      emptyMessage="Bạn không có lịch nào quá hạn!"
    />
  );
}
