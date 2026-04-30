"use client";

import { useState } from "react";
import { Plus, CalendarCheck } from "lucide-react";
import type { Schedule } from "@smartschedule/shared";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ScheduleCard } from "./schedule-card";
import { ScheduleListSkeleton } from "./schedule-card-skeleton";
import { ScheduleFormDialog } from "./schedule-form-dialog";

interface Props {
  title: string;
  description?: string;
  schedules: Schedule[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  showAdd?: boolean;
}

export function ScheduleList({
  title,
  description,
  schedules,
  loading,
  emptyTitle = "Chưa có lịch nào",
  emptyDescription = "Thêm lịch đầu tiên để bắt đầu quản lý thời gian.",
  showAdd = true,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (s: Schedule) => {
    setEditing(s);
    setDialogOpen(true);
  };

  return (
    <div className="container max-w-5xl space-y-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground md:text-base">{description}</p>
          )}
        </div>
        {showAdd && (
          <Button onClick={openNew} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Thêm lịch
          </Button>
        )}
      </div>

      {loading ? (
        <ScheduleListSkeleton count={4} />
      ) : schedules.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title={emptyTitle}
          description={emptyDescription}
          action={
            showAdd && (
              <Button onClick={openNew} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Thêm lịch
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-3 animate-fade-in lg:grid-cols-2">
          {schedules.map((s) => (
            <ScheduleCard key={s.id} schedule={s} onEdit={openEdit} />
          ))}
        </div>
      )}

      <ScheduleFormDialog open={dialogOpen} onOpenChange={setDialogOpen} schedule={editing} />
    </div>
  );
}
