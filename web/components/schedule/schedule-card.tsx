"use client";

import { format } from "date-fns";
import { Check, Pencil, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  PRIORITY_FLAG,
  PRIORITY_LABEL_VI,
  type Schedule,
} from "@smartschedule/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface Props {
  schedule: Schedule;
  onEdit?: (schedule: Schedule) => void;
}

export function ScheduleCard({ schedule, onEdit }: Props) {
  const qc = useQueryClient();

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

  return (
    <Card className="transition hover:shadow-md">
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-1 items-center gap-2">
            <span className="text-lg" aria-hidden>
              {PRIORITY_FLAG[schedule.priority]}
            </span>
            <h3 className="line-clamp-1 text-base font-semibold">{schedule.title}</h3>
          </div>
          <div className="flex gap-1">
            {schedule.status === "pending" && (
              <Button
                size="icon"
                variant="ghost"
                title="Hoàn thành"
                onClick={() => completeMut.mutate()}
                disabled={completeMut.isPending}
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            {onEdit && (
              <Button size="icon" variant="ghost" title="Sửa" onClick={() => onEdit(schedule)}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              title="Xoá"
              onClick={() => {
                if (confirm("Xoá lịch này?")) deleteMut.mutate();
              }}
              disabled={deleteMut.isPending}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>
            {format(new Date(schedule.start_time), "HH:mm dd/MM/yyyy")}
            {schedule.end_time
              ? ` → ${format(new Date(schedule.end_time), "HH:mm")}`
              : ""}
          </span>
          <Badge variant="outline">{PRIORITY_LABEL_VI[schedule.priority]}</Badge>
          {schedule.status !== "pending" && (
            <Badge variant={schedule.status === "completed" ? "default" : "secondary"}>
              {schedule.status === "completed" ? "Hoàn thành" : "Huỷ"}
            </Badge>
          )}
          {schedule.recurrence_type !== "none" && (
            <Badge variant="secondary">🔁 {schedule.recurrence_type}</Badge>
          )}
          {schedule.tags?.map((t) => (
            <Badge key={t.id} variant="secondary">
              #{t.name}
            </Badge>
          ))}
        </div>

        {schedule.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{schedule.description}</p>
        )}
      </CardContent>
    </Card>
  );
}
