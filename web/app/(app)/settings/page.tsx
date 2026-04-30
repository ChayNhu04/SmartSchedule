"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { UserSettings } from "@smartschedule/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["user-settings"],
    queryFn: async () => (await api.get<UserSettings>("/users/me/settings")).data,
  });

  const [timezone, setTimezone] = useState("");
  const [defaultRemind, setDefaultRemind] = useState(30);
  const [notifyPush, setNotifyPush] = useState(true);
  const [workStart, setWorkStart] = useState(0);
  const [workEnd, setWorkEnd] = useState(0);

  useEffect(() => {
    if (data) {
      setTimezone(data.timezone);
      setDefaultRemind(data.default_remind_minutes);
      setNotifyPush(data.notify_via_push);
      setWorkStart(data.work_start_hour);
      setWorkEnd(data.work_end_hour);
    }
  }, [data]);

  const mut = useMutation({
    mutationFn: async () =>
      api.patch("/users/me/settings", {
        timezone,
        default_remind_minutes: defaultRemind,
        notify_via_push: notifyPush,
        work_start_hour: workStart,
        work_end_hour: workEnd,
      }),
    onSuccess: () => {
      toast.success("Đã lưu cài đặt");
      qc.invalidateQueries({ queryKey: ["user-settings"] });
    },
    onError: () => toast.error("Lỗi lưu cài đặt"),
  });

  return (
    <div className="container max-w-2xl space-y-6 py-8">
      <h1 className="text-3xl font-bold">Cài đặt</h1>

      <Card>
        <CardHeader>
          <CardTitle>Tài khoản</CardTitle>
          <CardDescription>{user?.email}</CardDescription>
        </CardHeader>
        {user?.display_name && (
          <CardContent>
            <p className="text-sm">Tên hiển thị: {user.display_name}</p>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tuỳ chọn</CardTitle>
          <CardDescription>
            Khung giờ làm việc — reminder ngoài khung sẽ dồn về sáng hôm sau
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Múi giờ (IANA, ví dụ: Asia/Ho_Chi_Minh)</Label>
            <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Số phút nhắc trước (mặc định)</Label>
            <Input
              type="number"
              value={defaultRemind}
              onChange={(e) => setDefaultRemind(parseInt(e.target.value, 10) || 0)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="push">Gửi push notification</Label>
            <Switch id="push" checked={notifyPush} onCheckedChange={setNotifyPush} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bắt đầu giờ làm việc (0-23)</Label>
              <Input
                type="number"
                min={0}
                max={23}
                value={workStart}
                onChange={(e) => setWorkStart(parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Kết thúc giờ làm việc (0-23)</Label>
              <Input
                type="number"
                min={0}
                max={23}
                value={workEnd}
                onChange={(e) => setWorkEnd(parseInt(e.target.value, 10) || 0)}
              />
            </div>
          </div>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
