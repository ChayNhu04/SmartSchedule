import { useQuery } from "@tanstack/react-query";
import { FlatList } from "react-native";
import { router } from "expo-router";
import { ScheduleCard } from "../../components/ScheduleCard";
import { Screen } from "../../components/Screen";
import { EmptyState } from "../../components/EmptyState";
import { ScheduleListSkeleton } from "../../components/Skeleton";
import { spacing } from "../../theme/tokens";
import { api } from "../../services/api";
import type { Schedule } from "../../types/schedule";

export default function UpcomingScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["schedules", "upcoming"],
    queryFn: async () => (await api.get<Schedule[]>("/schedules/upcoming?limit=20")).data,
  });

  return (
    <Screen title="Sắp tới" subtitle="20 lịch sắp tới gần nhất">
      {isLoading ? (
        <ScheduleListSkeleton count={4} />
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
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title="Chưa có lịch sắp tới"
              description="Khi bạn thêm lịch trong tương lai, chúng sẽ hiện ở đây."
            />
          }
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}
        />
      )}
    </Screen>
  );
}
