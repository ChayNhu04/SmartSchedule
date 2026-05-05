import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isPast } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ITEM_TYPE_LABEL_VI,
  PRIORITY_LABEL_VI,
  RECURRENCE_LABEL_VI,
  type Schedule,
} from "@smartschedule/shared";
import { Screen } from "../../../components/Screen";
import { Button } from "../../../components/Button";
import { useTheme } from "../../../theme/ThemeContext";
import { radius, spacing, typography } from "../../../theme/tokens";
import { api } from "../../../services/api";

export default function ScheduleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["schedules", id],
    queryFn: async () => (await api.get<Schedule>(`/schedules/${id}`)).data,
    enabled: !!id,
  });

  const undoMut = useMutation({
    mutationFn: () => api.post("/schedules/undo"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedules"] });
      qc.invalidateQueries({ queryKey: ["schedules", id] });
      Alert.alert("Đã hoàn tác");
    },
    onError: (err) => {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      Alert.alert(
        "Không thể hoàn tác",
        e.response?.data?.message ?? e.message ?? "Quá thời gian (10 phút).",
      );
    },
  });

  const completeMut = useMutation({
    mutationFn: () => api.post(`/schedules/${id}/complete`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedules"] });
      Alert.alert("Đã đánh dấu hoàn thành", undefined, [
        { text: "Hoàn tác", onPress: () => undoMut.mutate() },
        { text: "OK", style: "cancel" },
      ]);
    },
    onError: (err) => {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      Alert.alert("Lỗi", e.response?.data?.message ?? e.message ?? "Không thể cập nhật");
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => api.delete(`/schedules/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedules"] });
      Alert.alert("Đã xoá", undefined, [
        {
          text: "Hoàn tác",
          onPress: async () => {
            try {
              await api.post("/schedules/undo");
              qc.invalidateQueries({ queryKey: ["schedules"] });
              Alert.alert("Đã hoàn tác");
            } catch (e) {
              const err = e as { response?: { data?: { message?: string } } };
              Alert.alert(
                "Không thể hoàn tác",
                err.response?.data?.message ?? "Quá thời gian (10 phút).",
              );
              router.back();
            }
          },
        },
        { text: "OK", style: "cancel", onPress: () => router.back() },
      ]);
    },
    onError: (err) => {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      Alert.alert("Lỗi", e.response?.data?.message ?? e.message ?? "Không thể xoá");
    },
  });

  const confirmDelete = () => {
    Alert.alert(
      "Xoá lịch?",
      "Hành động này không thể hoàn tác.",
      [
        { text: "Huỷ", style: "cancel" },
        { text: "Xoá", style: "destructive", onPress: () => deleteMut.mutate() },
      ],
      { cancelable: true },
    );
  };

  const back = (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.back()}
      style={[styles.backBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
    >
      <Ionicons name="chevron-back" size={20} color={colors.text} />
      <Text style={[typography.body, { color: colors.text, marginLeft: 4 }]}>Quay lại</Text>
    </Pressable>
  );

  if (isLoading || !data) {
    return (
      <Screen title="Chi tiết">
        <View style={{ paddingHorizontal: spacing.lg }}>
          {back}
          <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.lg }]}>
            {error ? "Không tải được lịch." : "Đang tải..."}
          </Text>
        </View>
      </Screen>
    );
  }

  const start = new Date(data.start_time);
  const end = data.end_time ? new Date(data.end_time) : null;
  const remind = data.remind_at ? new Date(data.remind_at) : null;
  const isDone = data.status === "completed";
  const isCancelled = data.status === "cancelled";
  const isOverdue = data.status === "pending" && isPast(start);

  const priorityColor =
    data.priority === "high"
      ? colors.priorityHigh
      : data.priority === "low"
        ? colors.priorityLow
        : colors.priorityNormal;

  return (
    <Screen title="Chi tiết">
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {back}

        <View style={[styles.titleRow, { marginTop: spacing.lg }]}>
          <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                typography.h2,
                {
                  color: colors.text,
                  textDecorationLine: isDone ? "line-through" : "none",
                },
              ]}
            >
              {data.title}
            </Text>
            <Text style={[typography.body, { color: colors.textMuted, marginTop: 2 }]}>
              {ITEM_TYPE_LABEL_VI[data.item_type]} · Ưu tiên{" "}
              {PRIORITY_LABEL_VI[data.priority]}
            </Text>
          </View>
        </View>

        {(isDone || isCancelled || isOverdue) && (
          <View style={{ flexDirection: "row", gap: spacing.xs, marginTop: spacing.sm }}>
            {isDone && (
              <Badge color={colors.success} bg={colors.successMuted}>
                Hoàn thành
              </Badge>
            )}
            {isCancelled && (
              <Badge color={colors.textMuted} bg={colors.surface}>
                Đã huỷ
              </Badge>
            )}
            {isOverdue && (
              <Badge color={colors.destructive} bg={colors.destructiveMuted}>
                Quá hạn
              </Badge>
            )}
          </View>
        )}

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Row label="Bắt đầu" value={format(start, "EEEE, d MMM yyyy · HH:mm", { locale: vi })} />
          {end && (
            <Row
              label="Kết thúc"
              value={format(end, "EEEE, d MMM yyyy · HH:mm", { locale: vi })}
            />
          )}
          {remind && (
            <Row
              label="Nhắc lúc"
              value={format(remind, "EEEE, d MMM yyyy · HH:mm", { locale: vi })}
            />
          )}
          {data.recurrence_type !== "none" && (
            <Row label="Lặp" value={RECURRENCE_LABEL_VI[data.recurrence_type]} />
          )}
        </View>

        {data.description ? (
          <View
            style={[
              styles.section,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text
              style={[typography.captionStrong, { color: colors.textMuted, marginBottom: 4 }]}
            >
              Mô tả
            </Text>
            <Text style={[typography.body, { color: colors.text }]}>{data.description}</Text>
          </View>
        ) : null}

        <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
          {data.status === "pending" && (
            <Button
              label="Đánh dấu hoàn thành"
              onPress={() => completeMut.mutate()}
              loading={completeMut.isPending}
              size="lg"
            />
          )}
          <Button
            label="Sửa"
            variant="secondary"
            size="lg"
            onPress={() => router.push(`/schedule/${data.id}/edit` as never)}
          />
          <Button
            label="Chia sẻ"
            variant="secondary"
            size="lg"
            onPress={() => router.push(`/schedule/${data.id}/share` as never)}
          />
          <Button
            label="Xoá"
            variant="destructive"
            size="lg"
            onPress={confirmDelete}
            loading={deleteMut.isPending}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", paddingVertical: 6 }}>
      <Text style={[typography.captionStrong, { color: colors.textMuted, width: 100 }]}>
        {label}
      </Text>
      <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{value}</Text>
    </View>
  );
}

function Badge({
  color,
  bg,
  children,
}: {
  color: string;
  bg: string;
  children: string;
}) {
  return (
    <View
      style={{
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.full,
        backgroundColor: bg,
      }}
    >
      <Text style={[typography.captionStrong, { color }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.sm,
  },
  priorityBar: {
    width: 4,
    borderRadius: 2,
  },
  section: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
});
