import { FlatList, RefreshControl } from "react-native";
import { Stack, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import type { Schedule } from "@smartschedule/shared";
import { ScheduleCard } from "../components/ScheduleCard";
import { Screen } from "../components/Screen";
import { EmptyState } from "../components/EmptyState";
import { ScheduleListSkeleton } from "../components/Skeleton";
import { useTheme } from "../theme/ThemeContext";
import { spacing } from "../theme/tokens";
import { api } from "../services/api";

export default function OverdueScreen() {
  const { colors } = useTheme();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["schedules", "overdue"],
    queryFn: async () =>
      (await api.get<Schedule[]>("/schedules/overdue")).data,
  });

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Quá hạn",
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
              <ScheduleCard
                schedule={item}
                onPress={() => router.push(`/schedule/${item.id}` as never)}
              />
            )}
            ListEmptyComponent={
              <EmptyState
                icon="checkmark-done-outline"
                title="Không có lịch quá hạn"
                description="Tuyệt — bạn không còn lịch nào quá hạn. Hãy giữ phong độ này nhé!"
              />
            }
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={colors.primary}
              />
            }
            contentContainerStyle={{
              paddingHorizontal: spacing.lg,
              paddingBottom: spacing.lg,
            }}
          />
        )}
      </Screen>
    </>
  );
}
