import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import type { Tag } from "@smartschedule/shared";
import { ScheduleCard } from "../../components/ScheduleCard";
import { Screen } from "../../components/Screen";
import { EmptyState } from "../../components/EmptyState";
import { ScheduleListSkeleton } from "../../components/Skeleton";
import { useTheme } from "../../theme/ThemeContext";
import { radius, spacing, typography } from "../../theme/tokens";
import { api } from "../../services/api";
import type { Schedule } from "../../types/schedule";

export default function UpcomingScreen() {
  const { colors } = useTheme();
  const [tagId, setTagId] = useState<number | null>(null);

  const { data: tags } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => (await api.get<Tag[]>("/tags")).data,
    staleTime: 60_000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["schedules", "upcoming", tagId],
    queryFn: async () => {
      const url = tagId
        ? `/schedules/upcoming?limit=20&tag_id=${tagId}`
        : "/schedules/upcoming?limit=20";
      return (await api.get<Schedule[]>(url)).data;
    },
  });

  return (
    <Screen title="Sắp tới" subtitle="20 lịch sắp tới gần nhất">
      {tags && tags.length > 0 && (
        <View style={styles.filterRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.xs }}
          >
            <FilterChip
              label="Tất cả"
              active={tagId === null}
              onPress={() => setTagId(null)}
              colors={colors}
            />
            {tags.map((t) => (
              <FilterChip
                key={t.id}
                label={`#${t.name}`}
                active={tagId === t.id}
                onPress={() => setTagId(t.id)}
                colors={colors}
              />
            ))}
          </ScrollView>
        </View>
      )}
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
              title={tagId ? "Không có lịch nào" : "Chưa có lịch sắp tới"}
              description={
                tagId
                  ? "Không có lịch sắp tới nào gắn nhãn này."
                  : "Khi bạn thêm lịch trong tương lai, chúng sẽ hiện ở đây."
              }
            />
          }
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}
        />
      )}
    </Screen>
  );
}

interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
}

function FilterChip({ label, active, onPress, colors }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.primaryMuted : colors.card,
          borderColor: active ? colors.primary : colors.border,
        },
      ]}
    >
      <Text
        style={[
          typography.caption,
          { color: active ? colors.primary : colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    paddingVertical: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
});
