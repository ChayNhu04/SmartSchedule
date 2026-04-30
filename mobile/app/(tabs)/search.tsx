import { useState } from "react";
import { FlatList, StyleSheet, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { ScheduleCard } from "../../components/ScheduleCard";
import { api } from "../../services/api";
import type { Schedule } from "../../types/schedule";

export default function SearchScreen() {
  const [q, setQ] = useState("");
  const { data } = useQuery({
    queryKey: ["schedules", "search", q],
    queryFn: async () =>
      q ? (await api.get<Schedule[]>(`/schedules/search?q=${encodeURIComponent(q)}`)).data : [],
    enabled: q.length > 0,
  });

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Tìm kiếm</Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập từ khóa..."
        value={q}
        onChangeText={setQ}
      />
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
  heading: { fontSize: 24, fontWeight: "700", padding: 16, paddingBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    fontSize: 16,
  },
});
