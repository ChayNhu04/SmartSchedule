import { useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ScheduleCard } from "../../components/ScheduleCard";
import { Screen } from "../../components/Screen";
import { Input } from "../../components/Input";
import { EmptyState } from "../../components/EmptyState";
import { ScheduleListSkeleton } from "../../components/Skeleton";
import { useTheme } from "../../theme/ThemeContext";
import { spacing } from "../../theme/tokens";
import { api } from "../../services/api";
import type { Schedule } from "../../types/schedule";

export default function SearchScreen() {
  const { colors } = useTheme();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(id);
  }, [q]);

  const { data, isLoading } = useQuery({
    queryKey: ["schedules", "search", debounced],
    queryFn: async () =>
      debounced
        ? (await api.get<Schedule[]>(`/schedules/search?q=${encodeURIComponent(debounced)}`)).data
        : [],
    enabled: debounced.length > 0,
  });

  return (
    <Screen title="Tìm kiếm" subtitle="Tìm trong tiêu đề và mô tả">
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Input
          placeholder="Nhập từ khoá..."
          value={q}
          onChangeText={setQ}
          autoCapitalize="none"
          leftIcon={<Ionicons name="search" size={18} color={colors.textMuted} />}
        />
      </View>
      {isLoading && debounced ? (
        <ScheduleListSkeleton count={3} />
      ) : !debounced ? (
        <EmptyState
          icon="search-outline"
          title="Nhập từ khoá để tìm"
          description="Bạn có thể tìm theo tiêu đề hoặc mô tả của lịch."
        />
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState
          icon="sad-outline"
          title="Không tìm thấy kết quả"
          description={`Không có lịch nào khớp với "${debounced}".`}
        />
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
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}
        />
      )}
    </Screen>
  );
}
