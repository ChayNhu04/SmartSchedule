import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { format, isPast, isToday } from "date-fns";
import { vi } from "date-fns/locale";
import { Ionicons } from "@expo/vector-icons";
import type { Schedule } from "@smartschedule/shared";
import { Screen } from "../components/Screen";
import { EmptyState } from "../components/EmptyState";
import { ScheduleListSkeleton } from "../components/Skeleton";
import { useTheme } from "../theme/ThemeContext";
import { elevation, radius, spacing, typography } from "../theme/tokens";
import { api } from "../services/api";

export default function SharedScreen() {
  const { colors } = useTheme();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["schedules", "shared-with-me"],
    queryFn: async () =>
      (await api.get<Schedule[]>("/shared-with-me")).data,
  });

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Chia sẻ với tôi",
          headerTintColor: colors.text,
          headerStyle: { backgroundColor: colors.background },
        }}
      />
      <Screen edges={["bottom"]}>
        {isLoading ? (
          <ScheduleListSkeleton count={3} />
        ) : (
          <FlatList
            data={data ?? []}
            keyExtractor={(s) => String(s.id)}
            renderItem={({ item }) => (
              <SharedCard schedule={item} />
            )}
            ListEmptyComponent={
              <EmptyState
                icon="share-social-outline"
                title="Chưa có lịch nào được chia sẻ"
                description="Khi ai đó chia sẻ lịch với bạn, lịch sẽ xuất hiện ở đây."
              />
            }
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={colors.primary}
              />
            }
            ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
            contentContainerStyle={{
              padding: spacing.lg,
            }}
          />
        )}
      </Screen>
    </>
  );
}

function SharedCard({ schedule }: { schedule: Schedule }) {
  const { colors } = useTheme();
  const start = new Date(schedule.start_time);
  const end = schedule.end_time ? new Date(schedule.end_time) : null;
  const isDone = schedule.status === "completed";
  const isCancelled = schedule.status === "cancelled";
  const isOverdue = schedule.status === "pending" && isPast(start);

  const priorityColor =
    schedule.priority === "high"
      ? colors.priorityHigh
      : schedule.priority === "low"
        ? colors.priorityLow
        : colors.priorityNormal;

  const dateLabel = isToday(start)
    ? "Hôm nay"
    : format(start, "EEE, d MMM", { locale: vi });
  const timeLabel = format(start, "HH:mm");
  const endLabel = end ? format(end, "HH:mm") : null;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: isDone || isCancelled ? 0.7 : 1,
        },
        elevation.soft,
      ]}
    >
      <View style={[styles.bar, { backgroundColor: priorityColor }]} />
      <View style={{ flex: 1, padding: spacing.md }}>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          {dateLabel} · {timeLabel}
          {endLabel ? ` – ${endLabel}` : ""}
        </Text>
        <Text
          style={[
            typography.h3,
            {
              color: colors.text,
              marginTop: 4,
              textDecorationLine: isDone ? "line-through" : "none",
            },
          ]}
          numberOfLines={2}
        >
          {schedule.title}
        </Text>
        {schedule.description ? (
          <Text
            style={[typography.body, { color: colors.textMuted, marginTop: 4 }]}
            numberOfLines={2}
          >
            {schedule.description}
          </Text>
        ) : null}

        <View style={styles.badgesRow}>
          {schedule.user && (
            <View
              style={[
                styles.ownerBadge,
                {
                  backgroundColor: colors.primaryMuted,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Ionicons name="person-outline" size={12} color={colors.primary} />
              <Text
                style={[
                  typography.captionStrong,
                  { color: colors.primary, marginLeft: 4 },
                ]}
              >
                Từ{" "}
                {schedule.user.display_name || schedule.user.email}
              </Text>
            </View>
          )}
          {isOverdue && (
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: colors.destructiveMuted },
              ]}
            >
              <Text
                style={[typography.captionStrong, { color: colors.destructive }]}
              >
                Quá hạn
              </Text>
            </View>
          )}
          {isDone && (
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: colors.successMuted },
              ]}
            >
              <Text style={[typography.captionStrong, { color: colors.success }]}>
                Hoàn thành
              </Text>
            </View>
          )}
          {isCancelled && (
            <View
              style={[styles.statusBadge, { backgroundColor: colors.surface }]}
            >
              <Text
                style={[typography.captionStrong, { color: colors.textMuted }]}
              >
                Đã huỷ
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  bar: {
    width: 4,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  ownerBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
});
