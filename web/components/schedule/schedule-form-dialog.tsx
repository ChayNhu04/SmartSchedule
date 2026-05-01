"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  PRIORITIES,
  PRIORITY_LABEL_VI,
  ITEM_TYPES,
  RECURRENCES,
  type CreateScheduleRequest,
  type Schedule,
  type SchedulePriority,
  type ScheduleItemType,
  type RecurrenceType,
} from "@smartschedule/shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  schedule?: Schedule | null;
}

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const tzOffset = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}

function fromDatetimeLocal(local: string): string {
  return new Date(local).toISOString();
}

export function ScheduleFormDialog({ open, onOpenChange, schedule }: Props) {
  const qc = useQueryClient();
  const isEdit = !!schedule;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [priority, setPriority] = useState<SchedulePriority>("normal");
  const [itemType, setItemType] = useState<ScheduleItemType>("task");
  const [recurrence, setRecurrence] = useState<RecurrenceType>("none");

  useEffect(() => {
    if (schedule) {
      setTitle(schedule.title);
      setDescription(schedule.description ?? "");
      setStartTime(toDatetimeLocal(schedule.start_time));
      setEndTime(toDatetimeLocal(schedule.end_time));
      setRemindAt(toDatetimeLocal(schedule.remind_at));
      setPriority(schedule.priority);
      setItemType(schedule.item_type);
      setRecurrence(schedule.recurrence_type);
    } else {
      setTitle("");
      setDescription("");
      setStartTime("");
      setEndTime("");
      setRemindAt("");
      setPriority("normal");
      setItemType("task");
      setRecurrence("none");
    }
  }, [schedule, open]);

  const mut = useMutation({
    mutationFn: async () => {
      const payload: CreateScheduleRequest = {
        title,
        description: description || undefined,
        start_time: fromDatetimeLocal(startTime),
        end_time: endTime ? fromDatetimeLocal(endTime) : undefined,
        remind_at: remindAt ? fromDatetimeLocal(remindAt) : undefined,
        priority,
        item_type: itemType,
        recurrence_type: recurrence,
      };
      if (isEdit && schedule) {
        await api.patch(`/schedules/${schedule.id}`, payload);
      } else {
        await api.post("/schedules", payload);
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "Đã cập nhật" : "Đã tạo lịch");
      qc.invalidateQueries({ queryKey: ["schedules"] });
      onOpenChange(false);
    },
    onError: (err) => {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg ?? "Lỗi không xác định"));
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startTime) {
      toast.error("Cần nhập tiêu đề và thời gian bắt đầu");
      return;
    }
    mut.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Sửa lịch" : "Thêm lịch"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Cập nhật thông tin lịch của bạn." : "Tạo lịch mới và đặt nhắc nhở."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tiêu đề *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start">Bắt đầu *</Label>
              <Input
                id="start"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">Kết thúc</Label>
              <Input
                id="end"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remind">Nhắc lúc</Label>
            <Input
              id="remind"
              type="datetime-local"
              value={remindAt}
              onChange={(e) => setRemindAt(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Loại</Label>
              <Select value={itemType} onValueChange={(v) => setItemType(v as ScheduleItemType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ưu tiên</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as SchedulePriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABEL_VI[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lặp</Label>
              <Select value={recurrence} onValueChange={(v) => setRecurrence(v as RecurrenceType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRENCES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo lịch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
