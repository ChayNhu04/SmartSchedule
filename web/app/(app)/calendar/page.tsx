"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventInput } from "@fullcalendar/core";
import type { Schedule } from "@smartschedule/shared";
import { api } from "@/lib/api";
import { ScheduleFormDialog } from "@/components/schedule/schedule-form-dialog";
import { Button } from "@/components/ui/button";

// FullCalendar phải dynamic import vì dùng `window`
const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false });

const PRIORITY_COLOR: Record<string, string> = {
  low: "#10b981",
  normal: "#f59e0b",
  high: "#ef4444",
};

export default function CalendarPage() {
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["schedules", "all-for-calendar"],
    queryFn: async () =>
      (await api.get<{ items: Schedule[] }>("/schedules?limit=500")).data,
  });

  const events: EventInput[] = useMemo(
    () =>
      (data?.items ?? []).map((s) => ({
        id: String(s.id),
        title: s.title,
        start: s.start_time,
        end: s.end_time ?? undefined,
        backgroundColor: PRIORITY_COLOR[s.priority] ?? "#6b7280",
        borderColor: PRIORITY_COLOR[s.priority] ?? "#6b7280",
        extendedProps: { schedule: s },
      })),
    [data],
  );

  return (
    <div className="container space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lịch tháng</h1>
          <p className="text-muted-foreground">Click vào sự kiện để chỉnh sửa</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          + Thêm lịch
        </Button>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          height="auto"
          locale="vi"
          firstDay={1}
          eventClick={(info) => {
            const schedule = info.event.extendedProps?.schedule as Schedule | undefined;
            if (schedule) {
              setEditing(schedule);
              setDialogOpen(true);
            }
          }}
        />
      </div>
      <ScheduleFormDialog open={dialogOpen} onOpenChange={setDialogOpen} schedule={editing} />
    </div>
  );
}
