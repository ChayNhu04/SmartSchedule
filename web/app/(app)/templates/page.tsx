"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { ScheduleTemplate } from "@smartschedule/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { api } from "@/lib/api";

function combineLocalDateTime(date: string, time: string): Date | null {
  if (!date) return null;
  const [y, mo, da] = date.split("-").map(Number);
  const [hh, mm] = (time || "00:00").split(":").map(Number);
  if (!y || !mo || !da) return null;
  const d = new Date(y, (mo ?? 1) - 1, da ?? 1, hh ?? 0, mm ?? 0, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function TemplatesPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(60);

  const [instOpen, setInstOpen] = useState(false);
  const [instName, setInstName] = useState("");
  const [instDate, setInstDate] = useState("");
  const [instTime, setInstTime] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const instStartDate = combineLocalDateTime(instDate, instTime);

  const { data } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => (await api.get<ScheduleTemplate[]>("/templates")).data,
  });

  const createMut = useMutation({
    mutationFn: async () =>
      api.post("/templates", {
        name,
        title,
        duration_minutes: duration > 0 ? duration : undefined,
      }),
    onSuccess: () => {
      toast.success("Đã tạo mẫu");
      setName("");
      setTitle("");
      qc.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: () => toast.error("Lỗi tạo mẫu"),
  });

  const deleteMut = useMutation({
    mutationFn: async (n: string) => api.delete(`/templates/${n}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });

  const instMut = useMutation({
    mutationFn: async () => {
      if (!instStartDate) {
        throw new Error("Vui lòng chọn ngày và giờ bắt đầu");
      }
      return api.post(`/templates/${instName}/instantiate`, {
        start_time: instStartDate.toISOString(),
      });
    },
    onSuccess: () => {
      toast.success("Đã tạo lịch từ mẫu");
      qc.invalidateQueries({ queryKey: ["schedules"] });
      setInstOpen(false);
    },
    onError: (err: Error) => toast.error(err.message || "Không thể tạo lịch"),
  });

  return (
    <div className="container space-y-6 py-6 md:py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Mẫu lịch</h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">Lưu mẫu để nhân bản nhanh thành lịch mới</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tạo mẫu mới</CardTitle>
          <CardDescription>
            Đặt tên ngắn gọn (a-z, 0-9, -, _), khi cần dùng chỉ việc bấm &quot;Tạo lịch&quot;
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Tên mẫu</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="hop-tuan" />
          </div>
          <div className="space-y-2">
            <Label>Tiêu đề lịch</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Thời lượng (phút)</Label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10))}
            />
          </div>
          <div className="sm:col-span-3">
            <Button
              onClick={() => createMut.mutate()}
              disabled={!name || !title || createMut.isPending}
            >
              Tạo mẫu
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((t) => (
          <Card key={t.id}>
            <CardHeader>
              <CardTitle className="text-lg">{t.name}</CardTitle>
              <CardDescription>{t.title}</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setInstName(t.name);
                  setInstDate("");
                  setInstTime("");
                  setInstOpen(true);
                }}
                className="gap-1"
              >
                <Wand2 className="h-3 w-3" />
                Tạo lịch
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPendingDelete(t.name)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {(data?.length ?? 0) === 0 && (
          <p className="col-span-full text-muted-foreground">Chưa có mẫu nào.</p>
        )}
      </div>

      <Dialog open={instOpen} onOpenChange={setInstOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo lịch từ mẫu &quot;{instName}&quot;</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Thời gian bắt đầu *</Label>
            <div className="grid grid-cols-[1fr_140px] gap-2">
              <DatePicker
                ariaLabel="Ngày bắt đầu"
                value={instDate}
                onChange={setInstDate}
                required
              />
              <TimePicker
                ariaLabel="Giờ bắt đầu"
                value={instTime}
                onChange={setInstTime}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {instStartDate
                ? format(instStartDate, "EEEE, dd/MM/yyyy HH:mm", { locale: vi })
                : "VD: 01/05/2026 14:30"}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstOpen(false)}>
              Huỷ
            </Button>
            <Button
              onClick={() => instMut.mutate()}
              disabled={!instStartDate || instMut.isPending}
            >
              Tạo lịch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Xoá mẫu này?"
        description={
          pendingDelete
            ? `Mẫu "${pendingDelete}" sẽ bị xoá vĩnh viễn. Các lịch đã tạo trước đó vẫn giữ nguyên.`
            : undefined
        }
        confirmLabel="Xoá"
        cancelLabel="Huỷ"
        destructive
        onConfirm={() => {
          if (pendingDelete) {
            deleteMut.mutate(pendingDelete);
            setPendingDelete(null);
          }
        }}
      />
    </div>
  );
}
