"use client";

import { useMemo, useState } from "react";
import { Sparkles, Wand2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { parseScheduleText } from "@smartschedule/shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { bucketForStartTime, visibleOnPath } from "@/lib/schedule-bucket";

const EXAMPLES = [
  "mai 9h họp scrum",
  "tối nay học bài",
  "15/5 14h chiều cafe với Linh",
  "9h ăn sáng",
];

export function QuickAdd() {
  const [text, setText] = useState("");
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  // Recompute parse preview reactively. We re-evaluate "now" with each render
  // but the result is cheap and the user only stares at this for a few
  // seconds.
  const parsed = useMemo(() => {
    if (!text.trim()) return null;
    return parseScheduleText(text);
  }, [text]);

  const createMut = useMutation({
    mutationFn: async () => {
      if (!parsed) throw new Error("Chưa có nội dung");
      return api.post("/schedules", {
        title: parsed.title,
        start_time: parsed.start_time,
        end_time: parsed.end_time,
        item_type: "task",
        priority: "normal",
      });
    },
    onSuccess: () => {
      const iso = parsed?.start_time;
      qc.invalidateQueries({ queryKey: ["schedules"] });
      setText("");
      if (iso && !visibleOnPath(pathname, iso)) {
        const b = bucketForStartTime(iso);
        const phrase =
          b.key === "overdue"
            ? "Đã tạo. Lịch này đang quá hạn."
            : b.key === "today"
              ? "Đã tạo. Lịch hôm nay."
              : "Đã tạo. Lịch sắp tới.";
        toast.success(phrase, {
          action: {
            label: `Xem ở ${b.label}`,
            onClick: () => router.push(b.path),
          },
          duration: 6000,
        });
      } else {
        toast.success("Đã tạo lịch");
      }
    },
    onError: (err) => {
      const e = err as {
        response?: { data?: { message?: string | string[] } };
        message?: string;
      };
      const msg = Array.isArray(e?.response?.data?.message)
        ? e.response.data.message[0]
        : e?.response?.data?.message ?? e?.message ?? "Không thể tạo lịch";
      toast.error(msg);
    },
  });

  const onSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!parsed || createMut.isPending) return;
    createMut.mutate();
  };

  const previewLine = parsed
    ? `${parsed.title} — ${format(new Date(parsed.start_time), "EEEE, dd/MM/yyyy 'lúc' HH:mm", { locale: vi })}`
    : null;

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border bg-muted/30 p-3 space-y-2"
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5" />
        <span>
          Thêm nhanh — gõ tự nhiên rồi Enter. VD:{" "}
          <button
            type="button"
            onClick={() => setText(EXAMPLES[0])}
            className="underline-offset-2 hover:underline"
          >
            {EXAMPLES[0]}
          </button>
          {" · "}
          <button
            type="button"
            onClick={() => setText(EXAMPLES[1])}
            className="underline-offset-2 hover:underline"
          >
            {EXAMPLES[1]}
          </button>
          {" · "}
          <button
            type="button"
            onClick={() => setText(EXAMPLES[2])}
            className="underline-offset-2 hover:underline"
          >
            {EXAMPLES[2]}
          </button>
        </span>
      </div>
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='vd: "mai 9h họp scrum"'
          autoComplete="off"
          aria-label="Thêm lịch nhanh bằng tiếng Việt"
        />
        <Button
          type="submit"
          disabled={!parsed || createMut.isPending}
          className="gap-1.5 shrink-0"
        >
          <Wand2 className="h-4 w-4" />
          Thêm
        </Button>
      </div>
      {previewLine && (
        <div className="text-xs text-muted-foreground pl-1">
          <span className="font-medium text-foreground">Sẽ tạo:</span>{" "}
          {previewLine}
          {parsed?.inferred && parsed.inferred.length > 0 && (
            <span className="text-amber-600 dark:text-amber-400">
              {" "}
              ({parsed.inferred.join("; ")})
            </span>
          )}
        </div>
      )}
    </form>
  );
}
