"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Trash2, UserPlus } from "lucide-react";
import type { UserSummary } from "@smartschedule/shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  scheduleId: number;
  scheduleTitle: string;
}

function pickError(err: unknown, fallback: string): string {
  const e = err as {
    response?: { data?: { message?: string | string[] } };
    message?: string;
  };
  const msg = e?.response?.data?.message ?? e?.message;
  if (Array.isArray(msg)) return msg[0] || fallback;
  return msg || fallback;
}

export function ShareDialog({
  open,
  onOpenChange,
  scheduleId,
  scheduleTitle,
}: Props) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [foundUser, setFoundUser] = useState<UserSummary | null>(null);

  const sharesQuery = useQuery({
    enabled: open,
    queryKey: ["schedule-shares", scheduleId],
    queryFn: async () =>
      (await api.get<UserSummary[]>(`/schedules/${scheduleId}/shares`)).data,
  });

  const lookupMut = useMutation({
    mutationFn: async () => {
      const trimmed = email.trim();
      if (!trimmed) throw new Error("Vui lòng nhập email");
      const { data } = await api.get<UserSummary>(
        `/users/lookup?email=${encodeURIComponent(trimmed)}`,
      );
      return data;
    },
    onSuccess: (u) => {
      setFoundUser(u);
    },
    onError: (err) => {
      setFoundUser(null);
      toast.error(pickError(err, "Không tìm thấy người dùng"));
    },
  });

  const shareMut = useMutation({
    mutationFn: async () => {
      if (!foundUser) throw new Error("Chưa tìm người dùng");
      return api.post(`/schedules/${scheduleId}/shares`, {
        target_user_id: foundUser.id,
      });
    },
    onSuccess: () => {
      toast.success(
        `Đã chia sẻ với ${foundUser?.display_name || foundUser?.email}`,
      );
      setEmail("");
      setFoundUser(null);
      qc.invalidateQueries({ queryKey: ["schedule-shares", scheduleId] });
    },
    onError: (err) => toast.error(pickError(err, "Không thể chia sẻ")),
  });

  const unshareMut = useMutation({
    mutationFn: async (targetId: string) =>
      api.delete(`/schedules/${scheduleId}/shares/${targetId}`),
    onSuccess: () => {
      toast.success("Đã gỡ chia sẻ");
      qc.invalidateQueries({ queryKey: ["schedule-shares", scheduleId] });
    },
    onError: () => toast.error("Không thể gỡ chia sẻ"),
  });

  const handleClose = (v: boolean) => {
    if (!v) {
      setEmail("");
      setFoundUser(null);
      lookupMut.reset();
    }
    onOpenChange(v);
  };

  const shares = sharesQuery.data ?? [];
  const alreadyShared = !!(
    foundUser && shares.some((s) => s.id === foundUser.id)
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chia sẻ lịch</DialogTitle>
          <DialogDescription className="line-clamp-2">
            &quot;{scheduleTitle}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="share-email">Email người nhận</Label>
            <div className="flex gap-2">
              <Input
                id="share-email"
                type="email"
                placeholder="ten@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (foundUser) setFoundUser(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && email.trim()) {
                    e.preventDefault();
                    lookupMut.mutate();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => lookupMut.mutate()}
                disabled={!email.trim() || lookupMut.isPending}
                className="gap-1.5"
              >
                <Search className="h-4 w-4" />
                Tìm
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Người nhận phải có tài khoản SmartSchedule để được chia sẻ.
            </p>
          </div>

          {foundUser && (
            <div className="rounded-md border bg-muted/40 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {foundUser.display_name || foundUser.email}
                  </p>
                  {foundUser.display_name && (
                    <p className="truncate text-xs text-muted-foreground">
                      {foundUser.email}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => shareMut.mutate()}
                  disabled={shareMut.isPending || alreadyShared}
                  className="shrink-0 gap-1.5"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  {alreadyShared ? "Đã chia sẻ" : "Chia sẻ"}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium">
              Đã chia sẻ với{" "}
              <span className="text-muted-foreground">({shares.length})</span>
            </p>
            {sharesQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Đang tải…</p>
            ) : shares.length === 0 ? (
              <p className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
                Chưa chia sẻ với ai
              </p>
            ) : (
              <ul className="space-y-1.5">
                {shares.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center justify-between gap-2 rounded-md border p-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {u.display_name || u.email}
                      </p>
                      {u.display_name && (
                        <p className="truncate text-xs text-muted-foreground">
                          {u.email}
                        </p>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      title="Gỡ chia sẻ"
                      aria-label={`Gỡ chia sẻ với ${u.email}`}
                      onClick={() => unshareMut.mutate(u.id)}
                      disabled={unshareMut.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
