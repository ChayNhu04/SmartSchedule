"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon } from "lucide-react";
import type { Schedule } from "@smartschedule/shared";
import { Input } from "@/components/ui/input";
import { ScheduleCard } from "@/components/schedule/schedule-card";
import { api } from "@/lib/api";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");

  // simple debounce
  useState(() => {
    const id = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(id);
  });

  const { data, isLoading } = useQuery({
    queryKey: ["schedules", "search", debounced],
    queryFn: async () =>
      debounced
        ? (await api.get<Schedule[]>(`/schedules/search?q=${encodeURIComponent(debounced)}`)).data
        : [],
    enabled: debounced.length > 0,
  });

  return (
    <div className="container space-y-6 py-8">
      <h1 className="text-3xl font-bold">Tìm kiếm</h1>
      <div className="relative max-w-xl">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Nhập từ khoá (tiêu đề hoặc mô tả)..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setDebounced(e.target.value);
          }}
        />
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (data?.length ?? 0) === 0 ? (
        <p className="text-muted-foreground">
          {debounced ? "Không tìm thấy kết quả nào." : "Nhập từ khoá để tìm."}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data!.map((s) => (
            <ScheduleCard key={s.id} schedule={s} />
          ))}
        </div>
      )}
    </div>
  );
}
