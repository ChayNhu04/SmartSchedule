import { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
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

type PickerMode = "date" | "time" | null;

export default function AddScreen() {
  const { colors } = useTheme();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const openDatePicker = () => setPickerMode("date");

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    // Android: native dialog dismisses itself; we close on every event.
    // iOS: spinner stays inline, user dismisses with the X / button below.
    if (Platform.OS === "android") {
      setPickerMode(null);
    }
    if (event.type !== "set" || !selected) return;

    const next = startDate ? new Date(startDate) : new Date();
    if (pickerMode === "date") {
      next.setFullYear(
        selected.getFullYear(),
        selected.getMonth(),
        selected.getDate(),
      );
      setStartDate(next);
      // Android UX: chain into time picker so the user picks both in one flow.
      if (Platform.OS === "android") {
        setPickerMode("time");
      }
    } else if (pickerMode === "time") {
      next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setStartDate(next);
    }
  };

  const closePicker = () => setPickerMode(null);

  const submit = async () => {
    if (!title || !startDate) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng nhập tiêu đề và chọn thời gian bắt đầu",
      );
      return;
    }
    setLoading(true);
    try {
      await api.post("/schedules", {
        title,
        description,
        start_time: startDate.toISOString(),
        priority,
      });
      qc.invalidateQueries({ queryKey: ["schedules"] });
      Alert.alert("Đã lưu", "Tạo lịch thành công");
      router.replace("/(tabs)");
      setTitle("");
      setDescription("");
      setStartDate(null);
      setPriority("normal");
    } catch (err) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      Alert.alert(
        "Lỗi",
        e.response?.data?.message ?? e.message ?? "Có lỗi xảy ra",
      );
    } finally {
      setLoading(false);
    }
  };

  const startLabel = startDate
    ? format(startDate, "EEEE, dd/MM/yyyy HH:mm", { locale: vi })
    : "Chọn ngày & giờ";

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

        <Text
          style={[
            typography.captionStrong,
            { color: colors.text, marginBottom: spacing.xs },
          ]}
        >
          Bắt đầu
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Chọn ngày và giờ bắt đầu"
          testID="start-time-picker"
          onPress={openDatePicker}
          style={[
            styles.dateRow,
            {
              backgroundColor: colors.card,
              borderColor: startDate ? colors.primary : colors.border,
            },
          ]}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color={startDate ? colors.primary : colors.textMuted}
            style={{ marginRight: spacing.sm }}
          />
          <Text
            style={[
              typography.bodyLg,
              {
                color: startDate ? colors.text : colors.textSubtle,
                flex: 1,
              },
            ]}
            numberOfLines={1}
          >
            {startLabel}
          </Text>
          {startDate && (
            <Pressable
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Xoá thời gian"
              onPress={(e) => {
                e.stopPropagation();
                setStartDate(null);
              }}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
          )}
        </Pressable>
        <Text
          style={[
            typography.caption,
            { color: colors.textMuted, marginTop: spacing.xs },
          ]}
        >
          Chạm để chọn ngày, sau đó chọn giờ
        </Text>

        {pickerMode && (
          <DateTimePicker
            value={startDate ?? new Date()}
            mode={pickerMode}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            is24Hour
            locale="vi-VN"
            onChange={onPickerChange}
          />
        )}
        {Platform.OS === "ios" && pickerMode && (
          <Pressable
            onPress={() => {
              if (pickerMode === "date") {
                if (!startDate) setStartDate(new Date());
                setPickerMode("time");
              } else {
                closePicker();
              }
            }}
            style={[styles.iosDoneRow, { borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel={
              pickerMode === "date" ? "Tiếp tục chọn giờ" : "Xong, đóng bảng chọn"
            }
          >
            <Text
              style={[
                typography.bodyStrong,
                { color: colors.primary, textAlign: "center" },
              ]}
            >
              {pickerMode === "date" ? "Tiếp: chọn giờ" : "Xong"}
            </Text>
          </Pressable>
        )}

        <Text
          style={[
            typography.captionStrong,
            { color: colors.text, marginBottom: spacing.xs, marginTop: spacing.lg },
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
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  iosDoneRow: {
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
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
