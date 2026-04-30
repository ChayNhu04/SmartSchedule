import { useQuery } from "@tanstack/react-query";
import { FlatList, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScheduleCard } from "../../components/ScheduleCard";
import { api } from "../../services/api";
import type { Schedule } from "../../types/schedule";

export default function UpcomingScreen() {
  const { data } = useQuery({
    queryKey: ["schedules", "upcoming"],
    queryFn: async () => (await api.get<Schedule[]>("/schedules/upcoming?limit=20")).data,
  });

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Sắp tới</Text>
      <FlatList
        data={data ?? []}
        keyExtractor={(s) => String(s.id)}
        renderItem={({ item }) => <ScheduleCard schedule={item} />}
        contentContainerStyle={{ padding: 16 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7f8" },
  heading: { fontSize: 24, fontWeight: "700", padding: 16 },
});
