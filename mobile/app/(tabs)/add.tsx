import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../../components/Screen";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme/ThemeContext";
import { radius, spacing, typography } from "../../theme/tokens";
import { api } from "../../services/api";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Thấp", colorKey: "priorityLow" as const },
  { value: "normal", label: "Vừa", colorKey: "priorityNormal" as const },
  { value: "high", label: "Cao", colorKey: "priorityHigh" as const },
] as const;

export default function AddScreen() {
  const { colors } = useTheme();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const submit = async () => {
    if (!title || !startTime) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tiêu đề và thời gian bắt đầu");
      return;
    }
    setLoading(true);
    try {
      await api.post("/schedules", { title, description, start_time: startTime, priority });
      qc.invalidateQueries({ queryKey: ["schedules"] });
      Alert.alert("Đã lưu", "Tạo lịch thành công");
      router.replace("/(tabs)");
      setTitle("");
      setDescription("");
      setStartTime("");
      setPriority("normal");
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      Alert.alert("Lỗi", e.response?.data?.message ?? e.message ?? "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen title="Thêm lịch" subtitle="Tạo lịch mới cho bạn">
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Input
          label="Tiêu đề"
          placeholder="VD: Họp team product"
          value={title}
          onChangeText={setTitle}
        />
        <Input
          label="Mô tả"
          placeholder="Ghi chú thêm (tuỳ chọn)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: "top" }}
        />
        <Input
          label="Bắt đầu"
          placeholder="2026-05-01T09:00:00+07:00"
          value={startTime}
          onChangeText={setStartTime}
          autoCapitalize="none"
          hint="Định dạng ISO 8601"
        />

        <Text
          style={[
            typography.captionStrong,
            { color: colors.text, marginBottom: spacing.xs, marginTop: spacing.sm },
          ]}
        >
          Ưu tiên
        </Text>
        <View style={styles.priorityRow}>
          {PRIORITY_OPTIONS.map((opt) => {
            const active = priority === opt.value;
            const dotColor = colors[opt.colorKey];
            return (
              <Pressable
                key={opt.value}
                onPress={() => setPriority(opt.value)}
                style={[
                  styles.priorityChip,
                  {
                    backgroundColor: active ? colors.primaryMuted : colors.surface,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <View style={[styles.dot, { backgroundColor: dotColor }]} />
                <Text
                  style={[
                    typography.bodyStrong,
                    { color: active ? colors.primary : colors.text },
                  ]}
                >
                  {opt.label}
                </Text>
                {active && (
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color={colors.primary}
                    style={{ marginLeft: 4 }}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <Button label="Lưu lịch" onPress={submit} loading={loading} size="lg" />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  priorityRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  priorityChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
});
