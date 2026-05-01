"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import type { ScheduleTemplate } from "@smartschedule/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { api } from "@/lib/api";

export default function TemplatesPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(60);

  const [instOpen, setInstOpen] = useState(false);
  const [instName, setInstName] = useState("");
  const [instStart, setInstStart] = useState("");

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
      toast.success("Đã tạo template");
      setName("");
      setTitle("");
      qc.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: () => toast.error("Lỗi tạo template"),
  });

  const deleteMut = useMutation({
    mutationFn: async (n: string) => api.delete(`/templates/${n}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });

  const instMut = useMutation({
    mutationFn: async () =>
      api.post(`/templates/${instName}/instantiate`, {
        start_time: new Date(instStart).toISOString(),
      }),
    onSuccess: () => {
      toast.success("Đã tạo lịch từ template");
      qc.invalidateQueries({ queryKey: ["schedules"] });
      setInstOpen(false);
    },
    onError: () => toast.error("Không thể tạo lịch"),
  });

  return (
    <div className="container space-y-6 py-6 md:py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Template</h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">Lưu preset để clone nhanh thành lịch mới</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tạo template mới</CardTitle>
          <CardDescription>
            Đặt tên ngắn gọn (a-z, 0-9, -, _), khi cần dùng chỉ việc bấm &quot;Tạo lịch&quot;
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Tên template</Label>
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
              Tạo template
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
                  setInstStart("");
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
                onClick={() => {
                  if (confirm(`Xoá template "${t.name}"?`)) deleteMut.mutate(t.name);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {(data?.length ?? 0) === 0 && (
          <p className="col-span-full text-muted-foreground">Chưa có template nào.</p>
        )}
      </div>

      <Dialog open={instOpen} onOpenChange={setInstOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo lịch từ template &quot;{instName}&quot;</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Thời gian bắt đầu</Label>
            <Input
              type="datetime-local"
              value={instStart}
              onChange={(e) => setInstStart(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstOpen(false)}>
              Huỷ
            </Button>
            <Button
              onClick={() => instMut.mutate()}
              disabled={!instStart || instMut.isPending}
            >
              Tạo lịch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
