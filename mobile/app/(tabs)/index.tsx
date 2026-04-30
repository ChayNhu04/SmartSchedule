import { useQuery } from "@tanstack/react-query";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScheduleCard } from "../../components/ScheduleCard";
import { api } from "../../services/api";
import type { Schedule } from "../../types/schedule";

export default function TodayScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["schedules", "today"],
    queryFn: async () => (await api.get<Schedule[]>("/schedules/today")).data,
  });

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Lịch hôm nay</Text>
      <FlatList
        data={data ?? []}
        keyExtractor={(s) => String(s.id)}
        renderItem={({ item }) => <ScheduleCard schedule={item} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>🎉 Không có lịch nào hôm nay</Text>
            </View>
          ) : null
        }
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={{ padding: 16 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7f8" },
  heading: { fontSize: 24, fontWeight: "700", padding: 16 },
  empty: { padding: 32, alignItems: "center" },
  emptyText: { color: "#888", fontSize: 14 },
});
