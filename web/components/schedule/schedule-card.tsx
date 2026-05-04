"use client";

import { useState } from "react";
import { format, isToday, isPast } from "date-fns";
import { vi } from "date-fns/locale";
import { Check, Pencil, Trash2, Repeat, Clock } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Schedule } from "@smartschedule/shared";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { PRIORITY_BAR_CLASS } from "@/lib/priority";
import { PriorityBadge } from "./priority-badge";

interface Props {
  schedule: Schedule;
  onEdit?: (schedule: Schedule) => void;
}

function formatRange(start: string, end?: string | null) {
  const s = new Date(start);
  const dayLabel = isToday(s)
    ? "Hôm nay"
    : format(s, "EEE, d MMM", { locale: vi });
  const time = format(s, "HH:mm");
  const endTime = end ? format(new Date(end), "HH:mm") : null;
  return endTime ? `${dayLabel} • ${time} – ${endTime}` : `${dayLabel} • ${time}`;
}

export function ScheduleCard({ schedule, onEdit }: Props) {
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isOverdue =
    schedule.status === "pending" && isPast(new Date(schedule.start_time));

  const completeMut = useMutation({
    mutationFn: () => api.post(`/schedules/${schedule.id}/complete`),
    onSuccess: () => {
      toast.success("Đã đánh dấu hoàn thành");
      qc.invalidateQueries({ queryKey: ["schedules"] });
    },
    onError: () => toast.error("Không thể cập nhật"),
  });

  const deleteMut = useMutation({
    mutationFn: () => api.delete(`/schedules/${schedule.id}`),
    onSuccess: () => {
      toast.success("Đã xoá");
      qc.invalidateQueries({ queryKey: ["schedules"] });
    },
    onError: () => toast.error("Không thể xoá"),
  });

  const isDone = schedule.status === "completed";
  const isCancelled = schedule.status === "cancelled";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-all",
        "hover:-translate-y-0.5 hover:shadow-elevated focus-within:ring-2 focus-within:ring-ring",
        (isDone || isCancelled) && "opacity-70",
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          PRIORITY_BAR_CLASS[schedule.priority],
        )}
        aria-hidden
      />

      <div className="flex flex-col gap-3 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              <span
                className={cn(
                  "truncate",
                  isOverdue && "font-medium text-destructive",
                )}
              >
                {formatRange(schedule.start_time, schedule.end_time)}
              </span>
            </div>
            <h3
              className={cn(
                "truncate text-base font-semibold leading-snug",
                isDone && "line-through text-muted-foreground",
              )}
            >
              {schedule.title}
            </h3>
            {schedule.description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {schedule.description}
              </p>
            )}
          </div>

          <div className="flex shrink-0 -mr-1 items-center gap-0.5">
            {schedule.status === "pending" && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                title="Hoàn thành"
                onClick={() => completeMut.mutate()}
                disabled={completeMut.isPending}
              >
                <Check className="h-4 w-4 text-success" />
              </Button>
            )}
            {onEdit && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                title="Sửa"
                onClick={() => onEdit(schedule)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              title="Xoá"
              onClick={() => setConfirmOpen(true)}
              disabled={deleteMut.isPending}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <PriorityBadge priority={schedule.priority} />

          {isOverdue && (
            <span className="inline-flex items-center rounded-full border border-destructive/20 bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
              Quá hạn
            </span>
          )}
          {isDone && (
            <span className="inline-flex items-center rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
              Hoàn thành
            </span>
          )}
          {isCancelled && (
            <span className="inline-flex items-center rounded-full border border-muted-foreground/20 bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Đã huỷ
            </span>
          )}

          {schedule.recurrence_type !== "none" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              <Repeat className="h-3 w-3" />
              {schedule.recurrence_type === "daily" && "Hằng ngày"}
              {schedule.recurrence_type === "weekly" && "Hằng tuần"}
              {schedule.recurrence_type === "monthly" && "Hằng tháng"}
            </span>
          )}

          {schedule.tags?.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
            >
              #{t.name}
            </span>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Xoá lịch này?"
        description={`"${schedule.title}" sẽ bị xoá vĩnh viễn. Hành động này không thể hoàn tác.`}
        confirmLabel="Xoá"
        cancelLabel="Huỷ"
        destructive
        onConfirm={() => deleteMut.mutate()}
      />
    </div>
  );
}
