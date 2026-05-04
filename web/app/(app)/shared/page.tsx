"use client";

import { useQuery } from "@tanstack/react-query";
import { Share2 } from "lucide-react";
import type { Schedule } from "@smartschedule/shared";
import { ScheduleCard } from "@/components/schedule/schedule-card";
import { ScheduleListSkeleton } from "@/components/schedule/schedule-card-skeleton";
import { EmptyState } from "@/components/empty-state";
import { api } from "@/lib/api";

export default function SharedPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["schedules", "shared-with-me"],
    queryFn: async () =>
      (await api.get<Schedule[]>("/shared-with-me")).data,
  });

  const schedules = data ?? [];

  return (
    <div className="container max-w-5xl space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Chia sẻ với tôi
        </h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          Lịch của người khác đã chia sẻ. Bạn chỉ có thể xem, không thể sửa.
        </p>
      </div>

      {isLoading ? (
        <ScheduleListSkeleton count={4} />
      ) : schedules.length === 0 ? (
        <EmptyState
          icon={Share2}
          title="Chưa có lịch nào được chia sẻ"
          description="Khi ai đó chia sẻ lịch với bạn, lịch sẽ xuất hiện ở đây."
        />
      ) : (
        <div className="grid gap-3 animate-fade-in lg:grid-cols-2">
          {schedules.map((s) => (
            <ScheduleCard key={s.id} schedule={s} readOnly />
          ))}
        </div>
      )}
    </div>
  );
}
