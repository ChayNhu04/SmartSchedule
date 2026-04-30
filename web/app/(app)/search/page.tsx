"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, Frown } from "lucide-react";
import type { Schedule } from "@smartschedule/shared";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { ScheduleCard } from "@/components/schedule/schedule-card";
import { ScheduleListSkeleton } from "@/components/schedule/schedule-card-skeleton";
import { api } from "@/lib/api";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(id);
  }, [q]);

  const { data, isLoading } = useQuery({
    queryKey: ["schedules", "search", debounced],
    queryFn: async () =>
      debounced
        ? (await api.get<Schedule[]>(`/schedules/search?q=${encodeURIComponent(debounced)}`)).data
        : [],
    enabled: debounced.length > 0,
  });

  return (
    <div className="container max-w-5xl space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Tìm kiếm</h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          Tìm theo tiêu đề hoặc mô tả.
        </p>
      </div>

      <div className="relative max-w-xl">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Nhập từ khoá..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isLoading && debounced ? (
        <ScheduleListSkeleton count={3} />
      ) : !debounced ? (
        <EmptyState
          icon={SearchIcon}
          title="Nhập từ khoá để tìm"
          description="Bạn có thể tìm trong tiêu đề và mô tả của lịch."
        />
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Frown}
          title="Không tìm thấy kết quả"
          description={`Không có lịch nào khớp với "${debounced}".`}
        />
      ) : (
        <div className="grid gap-3 animate-fade-in lg:grid-cols-2">
          {data!.map((s) => (
            <ScheduleCard key={s.id} schedule={s} />
          ))}
        </div>
      )}
    </div>
  );
}
