import { useQuery } from "@tanstack/react-query";
import { FlatList, RefreshControl } from "react-native";
import { ScheduleCard } from "../../components/ScheduleCard";
import { Screen } from "../../components/Screen";
import { EmptyState } from "../../components/EmptyState";
import { ScheduleListSkeleton } from "../../components/Skeleton";
import { useTheme } from "../../theme/ThemeContext";
import { spacing } from "../../theme/tokens";
import { api } from "../../services/api";
import type { Schedule } from "../../types/schedule";

export default function TodayScreen() {
  const { colors } = useTheme();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["schedules", "today"],
    queryFn: async () => (await api.get<Schedule[]>("/schedules/today")).data,
  });

  return (
    <Screen title="Hôm nay" subtitle="Lịch trong ngày">
      {isLoading ? (
        <ScheduleListSkeleton count={3} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(s) => String(s.id)}
          renderItem={({ item }) => <ScheduleCard schedule={item} />}
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
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}
        />
      )}
    </Screen>
  );
}
