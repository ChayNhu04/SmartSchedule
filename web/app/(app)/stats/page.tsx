"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ITEM_TYPE_LABEL_VI, PRIORITY_LABEL_VI } from "@smartschedule/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

type Range = "tuan" | "thang" | "nam";

interface Stats {
  total: number;
  completed: number;
  completionRate: number;
  byPriority: Record<string, number>;
  byType: Record<string, number>;
}

const RANGE_LABELS: Record<Range, string> = {
  tuan: "7 ngày",
  thang: "30 ngày",
  nam: "1 năm",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-emerald-500",
  normal: "bg-amber-500",
  high: "bg-red-500",
};

const TYPE_COLORS = ["bg-blue-500", "bg-violet-500", "bg-pink-500", "bg-cyan-500"];

export default function StatsPage() {
  const [range, setRange] = useState<Range>("thang");

  const { data, isLoading } = useQuery({
    queryKey: ["stats", range],
    queryFn: async () => (await api.get<Stats>(`/schedules/stats?range=${range}`)).data,
  });

  const byPriority = data
    ? Object.entries(data.byPriority).map(([key, count]) => ({
        key,
        label: PRIORITY_LABEL_VI[key as keyof typeof PRIORITY_LABEL_VI] ?? key,
        count,
        color: PRIORITY_COLORS[key] ?? "bg-slate-500",
      }))
    : [];

  const byType = data
    ? Object.entries(data.byType).map(([key, count], i) => ({
        key,
        label: ITEM_TYPE_LABEL_VI[key as keyof typeof ITEM_TYPE_LABEL_VI] ?? key,
        count,
        color: TYPE_COLORS[i % TYPE_COLORS.length],
      }))
    : [];

  const completionPercent = data ? Math.round(data.completionRate * 100) : 0;
  const maxPriority = Math.max(1, ...byPriority.map((b) => b.count));
  const totalType = byType.reduce((s, b) => s + b.count, 0);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold">Thống kê</h1>
        <p className="text-sm text-muted-foreground">
          Tổng quan lịch trong khung thời gian gần đây.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(RANGE_LABELS) as Range[]).map((r) => (
          <Button
            key={r}
            variant={range === r ? "default" : "outline"}
            size="sm"
            onClick={() => setRange(r)}
          >
            {RANGE_LABELS[r]}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : !data ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Không tải được dữ liệu thống kê.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryCard label="Tổng lịch" value={data.total} />
            <SummaryCard label="Đã hoàn thành" value={data.completed} />
            <SummaryCard label="Tỉ lệ hoàn thành" value={`${completionPercent}%`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Theo độ ưu tiên</CardTitle>
              </CardHeader>
              <CardContent>
                {byPriority.every((b) => b.count === 0) ? (
                  <EmptyChart />
                ) : (
                  <div className="space-y-3">
                    {byPriority.map((b) => (
                      <div key={b.key}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span>{b.label}</span>
                          <span className="font-medium tabular-nums">{b.count}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full ${b.color} transition-[width]`}
                            style={{ width: `${(b.count / maxPriority) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Theo loại</CardTitle>
              </CardHeader>
              <CardContent>
                {byType.every((b) => b.count === 0) ? (
                  <EmptyChart />
                ) : (
                  <div className="space-y-4">
                    <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                      {byType.map((b) =>
                        b.count > 0 ? (
                          <div
                            key={b.key}
                            className={`h-full ${b.color}`}
                            style={{ width: `${(b.count / totalType) * 100}%` }}
                            title={`${b.label}: ${b.count}`}
                          />
                        ) : null,
                      )}
                    </div>
                    <ul className="grid grid-cols-2 gap-2 text-sm">
                      {byType.map((b) => (
                        <li key={b.key} className="flex items-center gap-2">
                          <span className={`inline-block h-3 w-3 rounded ${b.color}`} />
                          <span className="flex-1">{b.label}</span>
                          <span className="font-medium tabular-nums">{b.count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Xuất lịch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                Tải file <code>.ics</code> chứa toàn bộ lịch của bạn để import vào Google
                Calendar, Outlook, Apple Calendar...
              </p>
              <Button onClick={downloadIcs}>Tải smartschedule.ics</Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
      Chưa có dữ liệu cho khung thời gian này.
    </div>
  );
}

async function downloadIcs() {
  try {
    const res = await api.get<Blob>("/schedules/export.ics", { responseType: "blob" });
    const blob = new Blob([res.data], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "smartschedule.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    alert("Không tải được file .ics. Hãy thử lại.");
  }
}
