"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  PRIORITIES,
  PRIORITY_FLAG,
  PRIORITY_LABEL_VI,
  ITEM_TYPES,
  ITEM_TYPE_LABEL_VI,
  RECURRENCES,
  RECURRENCE_LABEL_VI,
  type CreateScheduleRequest,
  type Schedule,
  type SchedulePriority,
  type ScheduleItemType,
  type RecurrenceType,
} from "@smartschedule/shared";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
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
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  schedule?: Schedule | null;
}

interface DateTimeParts {
  date: string; // YYYY-MM-DD (local)
  time: string; // HH:mm    (local)
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function toDateTimeParts(iso: string | null | undefined): DateTimeParts {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  return {
    date: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
    time: `${pad2(d.getHours())}:${pad2(d.getMinutes())}`,
  };
}

function combineDateTime(date: string, time: string): string | null {
  if (!date) return null;
  const [y, mo, da] = date.split("-").map(Number);
  const [hh, mm] = (time || "00:00").split(":").map(Number);
  if (!y || !mo || !da) return null;
  const d = new Date(y, (mo ?? 1) - 1, da ?? 1, hh ?? 0, mm ?? 0, 0, 0);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

interface DateTimeFieldProps {
  idPrefix: string;
  label: string;
  required?: boolean;
  date: string;
  time: string;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
}

function DateTimeField({
  idPrefix,
  label,
  required,
  date,
  time,
  onDateChange,
  onTimeChange,
}: DateTimeFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`${idPrefix}-date`}>
        {label}
        {required ? " *" : ""}
      </Label>
      <div className="grid grid-cols-[1fr_140px] gap-2">
        <DatePicker
          id={`${idPrefix}-date`}
          ariaLabel={`${label} – ngày`}
          value={date}
          onChange={onDateChange}
          required={required}
        />
        <TimePicker
          id={`${idPrefix}-time`}
          ariaLabel={`${label} – giờ`}
          value={time}
          onChange={onTimeChange}
          required={required}
        />
      </div>
    </div>
  );
}

function previewDatetimeVi(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return format(d, "EEEE, dd/MM/yyyy HH:mm", { locale: vi });
}

export function ScheduleFormDialog({ open, onOpenChange, schedule }: Props) {
  const qc = useQueryClient();
  const isEdit = !!schedule;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [remindDate, setRemindDate] = useState("");
  const [remindTime, setRemindTime] = useState("");
  const [priority, setPriority] = useState<SchedulePriority>("normal");
  const [itemType, setItemType] = useState<ScheduleItemType>("task");
  const [recurrence, setRecurrence] = useState<RecurrenceType>("none");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    if (schedule) {
      setTitle(schedule.title);
      setDescription(schedule.description ?? "");
      const s = toDateTimeParts(schedule.start_time);
      setStartDate(s.date);
      setStartTime(s.time);
      const e = toDateTimeParts(schedule.end_time);
      setEndDate(e.date);
      setEndTime(e.time);
      const r = toDateTimeParts(schedule.remind_at);
      setRemindDate(r.date);
      setRemindTime(r.time);
      setPriority(schedule.priority);
      setItemType(schedule.item_type);
      setRecurrence(schedule.recurrence_type);
      // Auto-open advanced section when editing if any advanced field has a value
      setAdvancedOpen(
        Boolean(schedule.end_time) ||
          Boolean(schedule.remind_at) ||
          schedule.item_type !== "task" ||
          schedule.recurrence_type !== "none",
      );
    } else {
      setTitle("");
      setDescription("");
      setStartDate("");
      setStartTime("");
      setEndDate("");
      setEndTime("");
      setRemindDate("");
      setRemindTime("");
      setPriority("normal");
      setItemType("task");
      setRecurrence("none");
      setAdvancedOpen(false);
    }
  }, [schedule, open]);

  const startIso = useMemo(() => combineDateTime(startDate, startTime), [startDate, startTime]);
  const endIso = useMemo(() => combineDateTime(endDate, endTime), [endDate, endTime]);
  const remindIso = useMemo(
    () => combineDateTime(remindDate, remindTime),
    [remindDate, remindTime],
  );

  const mut = useMutation({
    mutationFn: async () => {
      if (!startIso) throw new Error("Thời gian bắt đầu chưa hợp lệ");
      const payload: CreateScheduleRequest = {
        title,
        description: description || undefined,
        start_time: startIso,
        end_time: endIso ?? undefined,
        remind_at: remindIso ?? undefined,
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
        (err as { response?: { data?: { message?: string | string[] } }; message?: string })
          ?.response?.data?.message ??
        (err as { message?: string })?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg ?? "Lỗi không xác định"));
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !startTime) {
      toast.error("Cần nhập tiêu đề, ngày và giờ bắt đầu");
      return;
    }
    if (!startIso) {
      toast.error("Thời gian bắt đầu chưa hợp lệ");
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
            <Input
              id="title"
              placeholder="VD: Họp team product"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <DateTimeField
            idPrefix="start"
            label="Bắt đầu"
            required
            date={startDate}
            time={startTime}
            onDateChange={setStartDate}
            onTimeChange={setStartTime}
          />

          <div className="space-y-2">
            <Label>Ưu tiên</Label>
            <div
              role="radiogroup"
              aria-label="Mức ưu tiên"
              className="grid grid-cols-3 gap-2"
            >
              {PRIORITIES.map((p) => {
                const active = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setPriority(p)}
                    className={cn(
                      "flex h-10 items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input bg-background hover:bg-accent",
                    )}
                  >
                    <span aria-hidden>{PRIORITY_FLAG[p]}</span>
                    {PRIORITY_LABEL_VI[p]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Ghi chú thêm (tuỳ chọn)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            aria-expanded={advancedOpen}
            className="flex w-full items-center justify-between rounded-md border border-dashed border-input px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
          >
            <span>Tùy chọn nâng cao</span>
            {advancedOpen ? (
              <ChevronUp className="h-4 w-4" aria-hidden />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden />
            )}
          </button>

          {advancedOpen && (
            <div className="space-y-4 rounded-md border bg-muted/30 p-3">
              <DateTimeField
                idPrefix="end"
                label="Kết thúc"
                date={endDate}
                time={endTime}
                onDateChange={setEndDate}
                onTimeChange={setEndTime}
              />

              <DateTimeField
                idPrefix="remind"
                label="Nhắc lúc"
                date={remindDate}
                time={remindTime}
                onDateChange={setRemindDate}
                onTimeChange={setRemindTime}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Loại</Label>
                  <Select
                    value={itemType}
                    onValueChange={(v) => setItemType(v as ScheduleItemType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEM_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {ITEM_TYPE_LABEL_VI[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Lặp</Label>
                  <Select
                    value={recurrence}
                    onValueChange={(v) => setRecurrence(v as RecurrenceType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RECURRENCES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {RECURRENCE_LABEL_VI[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="sm:order-1"
            >
              Huỷ
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={mut.isPending}
              className="sm:order-2 sm:flex-1"
            >
              {mut.isPending ? "Đang lưu..." : isEdit ? "Cập nhật" : "Lưu lịch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
