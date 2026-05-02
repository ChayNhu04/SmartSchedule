import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateScheduleRequest, Schedule } from "@smartschedule/shared";
import { Screen } from "../../../components/Screen";
import { ScheduleForm } from "../../../components/ScheduleForm";
import { useTheme } from "../../../theme/ThemeContext";
import { radius, spacing, typography } from "../../../theme/tokens";
import { api } from "../../../services/api";

export default function ScheduleEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["schedules", id],
    queryFn: async () => (await api.get<Schedule>(`/schedules/${id}`)).data,
    enabled: !!id,
  });

  const handleSubmit = async (payload: CreateScheduleRequest) => {
    await api.patch(`/schedules/${id}`, payload);
    qc.invalidateQueries({ queryKey: ["schedules"] });
    Alert.alert("Đã lưu", "Cập nhật lịch thành công");
    router.back();
  };

  const back = (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.back()}
      style={[styles.backBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
    >
      <Ionicons name="chevron-back" size={20} color={colors.text} />
      <Text style={[typography.body, { color: colors.text, marginLeft: 4 }]}>Quay lại</Text>
    </Pressable>
  );

  if (isLoading || !data) {
    return (
      <Screen title="Sửa lịch">
        <View style={{ paddingHorizontal: spacing.lg }}>
          {back}
          <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.lg }]}>
            {error ? "Không tải được lịch." : "Đang tải..."}
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen title="Sửa lịch" subtitle={data.title}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>{back}</View>
      <ScheduleForm initial={data} submitLabel="Lưu thay đổi" onSubmit={handleSubmit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
  },
});
