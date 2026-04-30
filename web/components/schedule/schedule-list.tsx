"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { Schedule } from "@smartschedule/shared";
import { Button } from "@/components/ui/button";
import { ScheduleCard } from "./schedule-card";
import { ScheduleFormDialog } from "./schedule-form-dialog";

interface Props {
  title: string;
  description?: string;
  schedules: Schedule[];
  loading?: boolean;
  emptyMessage?: string;
  showAdd?: boolean;
}

export function ScheduleList({
  title,
  description,
  schedules,
  loading,
  emptyMessage = "Không có lịch nào.",
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
    <div className="container space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
        {showAdd && (
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Thêm lịch
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : schedules.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {schedules.map((s) => (
            <ScheduleCard key={s.id} schedule={s} onEdit={openEdit} />
          ))}
        </div>
      )}

      <ScheduleFormDialog open={dialogOpen} onOpenChange={setDialogOpen} schedule={editing} />
    </div>
  );
}
