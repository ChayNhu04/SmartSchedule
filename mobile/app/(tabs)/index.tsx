import { useQuery } from "@tanstack/react-query";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { Schedule } from "@smartschedule/shared";
import { ScheduleCard } from "../../components/ScheduleCard";
import { Screen } from "../../components/Screen";
import { EmptyState } from "../../components/EmptyState";
import { ScheduleListSkeleton } from "../../components/Skeleton";
import { QuickAdd } from "../../components/QuickAdd";
import { useTheme } from "../../theme/ThemeContext";
import { radius, spacing, typography } from "../../theme/tokens";
import { api } from "../../services/api";

export default function TodayScreen() {
  const { colors } = useTheme();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["schedules", "today"],
    queryFn: async () => (await api.get<Schedule[]>("/schedules/today")).data,
  });

  // Lightweight count query — refetches in parallel; doesn't block today list.
  const overdueQuery = useQuery({
    queryKey: ["schedules", "overdue"],
    queryFn: async () =>
      (await api.get<Schedule[]>("/schedules/overdue")).data,
  });
  const overdueCount = overdueQuery.data?.length ?? 0;

  const overdueBanner =
    overdueCount > 0 ? (
      <Pressable
        onPress={() => router.push("/overdue" as never)}
        style={({ pressed }) => [
          styles.banner,
          {
            backgroundColor: colors.destructiveMuted,
            borderColor: colors.destructive,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
        accessibilityLabel={`Mở danh sách ${overdueCount} lịch quá hạn`}
      >
        <Ionicons
          name="alert-circle"
          size={20}
          color={colors.destructive}
        />
        <View style={{ flex: 1 }}>
          <Text style={[typography.bodyStrong, { color: colors.destructive }]}>
            {overdueCount} lịch quá hạn
          </Text>
          <Text
            style={[typography.caption, { color: colors.destructive, opacity: 0.85 }]}
          >
            Bấm để xem và xử lý.
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.destructive}
        />
      </Pressable>
    ) : null;

  const header = (
    <View>
      <QuickAdd />
      {overdueBanner}
    </View>
  );

  return (
    <Screen title="Hôm nay" subtitle="Lịch trong ngày">
      {isLoading ? (
        <ScheduleListSkeleton count={3} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(s) => String(s.id)}
          renderItem={({ item }) => (
            <ScheduleCard
              schedule={item}
              onPress={() => router.push(`/schedule/${item.id}` as never)}
            />
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <EmptyState
              icon="sunny-outline"
              title="Hôm nay không có lịch nào"
              description="Một ngày trống — tận hưởng nhé! Hoặc thêm lịch mới ở tab Thêm."
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                refetch();
                overdueQuery.refetch();
              }}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
});
