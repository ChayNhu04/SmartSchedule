"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Tag } from "@smartschedule/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

export default function TagsPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => (await api.get<Tag[]>("/tags")).data,
  });

  const createMut = useMutation({
    mutationFn: async () => api.post("/tags", { name }),
    onSuccess: () => {
      toast.success("Đã thêm tag");
      setName("");
      qc.invalidateQueries({ queryKey: ["tags"] });
    },
    onError: () => toast.error("Tên tag không hợp lệ"),
  });

  const deleteMut = useMutation({
    mutationFn: async (n: string) => api.delete(`/tags/${n}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });

  return (
    <div className="container space-y-6 py-6 md:py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Nhãn (Tags)</h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">Quản lý các nhãn để phân loại lịch</p>
      </div>

      <Card>
        <CardContent className="flex gap-2 p-4">
          <Input
            placeholder="Tên tag mới (a-z, 0-9, -, _)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name) createMut.mutate();
            }}
          />
          <Button onClick={() => createMut.mutate()} disabled={!name || createMut.isPending}>
            Thêm
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <p>Đang tải...</p>
      ) : (data?.length ?? 0) === 0 ? (
        <p className="text-muted-foreground">Chưa có tag nào.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {data!.map((t) => (
            <Badge key={t.id} variant="secondary" className="gap-2 px-3 py-1.5 text-sm">
              #{t.name}
              <button
                onClick={() => {
                  if (confirm(`Xoá tag "${t.name}"?`)) deleteMut.mutate(t.name);
                }}
                className="ml-1 rounded hover:text-destructive"
                title="Xoá"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
