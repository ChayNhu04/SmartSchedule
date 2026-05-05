import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { ITEM_TYPE_LABEL_VI, PRIORITY_LABEL_VI } from "@smartschedule/shared";
import { Screen } from "../components/Screen";
import { Button } from "../components/Button";
import { useTheme } from "../theme/ThemeContext";
import { elevation, radius, spacing, typography } from "../theme/tokens";
import { api } from "../services/api";

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
  low: "#10b981",
  normal: "#f59e0b",
  high: "#ef4444",
};

const TYPE_PALETTE = ["#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function StatsScreen() {
  const { colors } = useTheme();
  const [range, setRange] = useState<Range>("thang");
  const [exporting, setExporting] = useState(false);

  const onExportIcs = async () => {
    setExporting(true);
    try {
      const res = await api.get<string>("/schedules/export.ics", {
        responseType: "text",
        transformResponse: (v) => v,
      });
      const file = new File(Paths.cache, "smartschedule.ics");
      if (file.exists) file.delete();
      file.create();
      file.write(res.data);
      const ok = await Sharing.isAvailableAsync();
      if (!ok) {
        Alert.alert(
          "Không hỗ trợ chia sẻ",
          "Thiết bị này không hỗ trợ mở/chia sẻ file.",
        );
        return;
      }
      await Sharing.shareAsync(file.uri, {
        mimeType: "text/calendar",
        dialogTitle: "Xuất lịch SmartSchedule",
        UTI: "public.calendar-event",
      });
    } catch {
      Alert.alert("Lỗi", "Không tải được file .ics. Hãy thử lại.");
    } finally {
      setExporting(false);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ["stats", range],
    queryFn: async () =>
      (await api.get<Stats>(`/schedules/stats?range=${range}`)).data,
  });

  const byPriority = data
    ? Object.entries(data.byPriority).map(([key, count]) => ({
        key,
        label:
          PRIORITY_LABEL_VI[key as keyof typeof PRIORITY_LABEL_VI] ?? key,
        count,
        color: PRIORITY_COLORS[key] ?? colors.textSubtle,
      }))
    : [];

  const byType = data
    ? Object.entries(data.byType).map(([key, count], i) => ({
        key,
        label:
          ITEM_TYPE_LABEL_VI[key as keyof typeof ITEM_TYPE_LABEL_VI] ?? key,
        count,
        color: TYPE_PALETTE[i % TYPE_PALETTE.length],
      }))
    : [];

  const completionPercent = data ? Math.round(data.completionRate * 100) : 0;
  const maxPriority = Math.max(1, ...byPriority.map((b) => b.count));
  const totalType = byType.reduce((s, b) => s + b.count, 0);

  return (
    <Screen title="Thống kê" subtitle="Tổng quan lịch gần đây">
      <Stack.Screen options={{ title: "Thống kê" }} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.lg }}
      >
        <View style={styles.rangeRow}>
          {(Object.keys(RANGE_LABELS) as Range[]).map((r) => {
            const active = r === range;
            return (
              <View key={r} style={{ flex: 1 }}>
                <Button
                  label={RANGE_LABELS[r]}
                  variant={active ? "primary" : "secondary"}
                  onPress={() => setRange(r)}
                />
              </View>
            );
          })}
        </View>

        {isLoading ? (
          <View style={[styles.loading, { backgroundColor: colors.card }]}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : !data ? (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
              elevation.soft,
            ]}
          >
            <Text style={[typography.body, { color: colors.textMuted }]}>
              Không tải được dữ liệu thống kê.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryRow}>
              <SummaryCard label="Tổng" value={String(data.total)} />
              <SummaryCard label="Hoàn thành" value={String(data.completed)} />
              <SummaryCard label="Tỉ lệ" value={`${completionPercent}%`} />
            </View>

            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
                elevation.soft,
              ]}
            >
              <Text
                style={[
                  typography.captionStrong,
                  {
                    color: colors.textMuted,
                    marginBottom: spacing.md,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  },
                ]}
              >
                Theo độ ưu tiên
              </Text>
              {byPriority.every((b) => b.count === 0) ? (
                <EmptyChart />
              ) : (
                byPriority.map((b) => (
                  <View key={b.key} style={{ marginBottom: spacing.sm }}>
                    <View style={styles.barLabelRow}>
                      <Text style={[typography.body, { color: colors.text }]}>
                        {b.label}
                      </Text>
                      <Text
                        style={[typography.bodyStrong, { color: colors.text }]}
                      >
                        {b.count}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.barTrack,
                        { backgroundColor: colors.border },
                      ]}
                    >
                      <View
                        style={{
                          height: "100%",
                          backgroundColor: b.color,
                          width: `${(b.count / maxPriority) * 100}%`,
                          borderRadius: 999,
                        }}
                      />
                    </View>
                  </View>
                ))
              )}
            </View>

            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
                elevation.soft,
              ]}
            >
              <Text
                style={[
                  typography.captionStrong,
                  {
                    color: colors.textMuted,
                    marginBottom: spacing.md,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  },
                ]}
              >
                Theo loại
              </Text>
              {byType.every((b) => b.count === 0) ? (
                <EmptyChart />
              ) : (
                <>
                  <View
                    style={[
                      styles.segmented,
                      { backgroundColor: colors.border },
                    ]}
                  >
                    {byType.map((b) =>
                      b.count > 0 ? (
                        <View
                          key={b.key}
                          style={{
                            backgroundColor: b.color,
                            width: `${(b.count / totalType) * 100}%`,
                            height: "100%",
                          }}
                        />
                      ) : null,
                    )}
                  </View>
                  <View style={{ marginTop: spacing.md, gap: spacing.xs }}>
                    {byType.map((b) => (
                      <View key={b.key} style={styles.legendRow}>
                        <View
                          style={[
                            styles.legendDot,
                            { backgroundColor: b.color },
                          ]}
                        />
                        <Text
                          style={[
                            typography.body,
                            { color: colors.text, flex: 1 },
                          ]}
                        >
                          {b.label}
                        </Text>
                        <Text
                          style={[
                            typography.bodyStrong,
                            { color: colors.text },
                          ]}
                        >
                          {b.count}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          </>
        )}

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
            elevation.soft,
          ]}
        >
          <Text
            style={[
              typography.captionStrong,
              {
                color: colors.textMuted,
                marginBottom: spacing.sm,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              },
            ]}
          >
            Xuất lịch
          </Text>
          <Text
            style={[
              typography.body,
              { color: colors.textMuted, marginBottom: spacing.md },
            ]}
          >
            Tải file .ics để import vào Google Calendar / Outlook / Apple
            Calendar.
          </Text>
          <Button
            label={exporting ? "Đang chuẩn bị..." : "Tải smartschedule.ics"}
            onPress={onExportIcs}
            disabled={exporting}
            loading={exporting}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.summaryCard,
        { backgroundColor: colors.card, borderColor: colors.border },
        elevation.soft,
      ]}
    >
      <Text
        style={[
          typography.captionStrong,
          {
            color: colors.textMuted,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[typography.h1, { color: colors.text, marginTop: spacing.xs }]}
      >
        {value}
      </Text>
    </View>
  );
}

function EmptyChart() {
  const { colors } = useTheme();
  return (
    <View style={styles.emptyChart}>
      <Text style={[typography.body, { color: colors.textMuted }]}>
        Chưa có dữ liệu cho khung thời gian này.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rangeRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  loading: {
    paddingVertical: spacing.xl,
    alignItems: "center",
    borderRadius: radius.lg,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  barLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  barTrack: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  segmented: {
    height: 12,
    flexDirection: "row",
    borderRadius: 999,
    overflow: "hidden",
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
  emptyChart: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
});
