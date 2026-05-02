import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  ITEM_TYPES,
  ITEM_TYPE_LABEL_VI,
  RECURRENCES,
  RECURRENCE_LABEL_VI,
  type CreateScheduleRequest,
  type RecurrenceType,
  type ScheduleItemType,
} from "@smartschedule/shared";
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

type Priority = (typeof PRIORITY_OPTIONS)[number]["value"];

// Format a numeric string into dd/mm/yyyy as the user types.
function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  if (digits.length <= 2) return dd;
  if (digits.length <= 4) return `${dd}/${mm}`;
  return `${dd}/${mm}/${yyyy}`;
}

// Format a numeric string into HH:mm as the user types.
function formatTimeInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  const hh = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  if (digits.length <= 2) return hh;
  return `${hh}:${mm}`;
}

// Combine "dd/mm/yyyy" + "HH:mm" into an ISO string in the device's local timezone.
// Returns null if either part is missing or invalid.
function combineDateTime(dateStr: string, timeStr: string): string | null {
  if (!dateStr) return null;
  const dateMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!dateMatch) return null;
  const [, ddS, mmS, yyyyS] = dateMatch;
  const dd = Number(ddS);
  const mo = Number(mmS);
  const yyyy = Number(yyyyS);
  if (!dd || !mo || !yyyy) return null;
  if (mo < 1 || mo > 12 || dd < 1 || dd > 31) return null;

  let hh = 0;
  let mi = 0;
  if (timeStr) {
    const timeMatch = timeStr.match(/^(\d{2}):(\d{2})$/);
    if (!timeMatch) return null;
    hh = Number(timeMatch[1]);
    mi = Number(timeMatch[2]);
    if (hh > 23 || mi > 59) return null;
  }

  const d = new Date(yyyy, mo - 1, dd, hh, mi, 0, 0);
  if (Number.isNaN(d.getTime())) return null;
  // Reject things like 31/02 which Date silently rolls over
  if (d.getFullYear() !== yyyy || d.getMonth() !== mo - 1 || d.getDate() !== dd) return null;
  return d.toISOString();
}

export default function AddScreen() {
  const { colors } = useTheme();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [remindDate, setRemindDate] = useState("");
  const [remindTime, setRemindTime] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [itemType, setItemType] = useState<ScheduleItemType>("task");
  const [recurrence, setRecurrence] = useState<RecurrenceType>("none");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const startIso = useMemo(() => combineDateTime(startDate, startTime), [startDate, startTime]);
  const endIso = useMemo(() => combineDateTime(endDate, endTime), [endDate, endTime]);
  const remindIso = useMemo(
    () => combineDateTime(remindDate, remindTime),
    [remindDate, remindTime],
  );

  const reset = () => {
    setTitle("");
    setDescription("");
    setStartDate("");
    setStartTime("");
    setEndDate("");
    setEndTime("");
    setRemindDate("");
    setRemindTime("");
    setPriority("normal");
    setItemType("task");
    setRecurrence("none");
    setAdvancedOpen(false);
  };

  const submit = async () => {
    if (!title.trim() || !startDate || !startTime) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tiêu đề, ngày và giờ bắt đầu");
      return;
    }
    if (!startIso) {
      Alert.alert("Thời gian không hợp lệ", "Hãy nhập ngày dạng dd/mm/yyyy và giờ dạng HH:mm");
      return;
    }
    if (advancedOpen) {
      if ((endDate || endTime) && !endIso) {
        Alert.alert("Thời gian kết thúc không hợp lệ", "Kiểm tra lại ngày/giờ kết thúc");
        return;
      }
      if ((remindDate || remindTime) && !remindIso) {
        Alert.alert("Thời gian nhắc không hợp lệ", "Kiểm tra lại ngày/giờ nhắc");
        return;
      }
    }
    setLoading(true);
    try {
      const payload: CreateScheduleRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        start_time: startIso,
        end_time: advancedOpen && endIso ? endIso : undefined,
        remind_at: advancedOpen && remindIso ? remindIso : undefined,
        priority,
        item_type: advancedOpen ? itemType : undefined,
        recurrence_type: advancedOpen ? recurrence : undefined,
      };
      await api.post("/schedules", payload);
      qc.invalidateQueries({ queryKey: ["schedules"] });
      Alert.alert("Đã lưu", "Tạo lịch thành công");
      router.replace("/(tabs)");
      reset();
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

        <Text
          style={[
            typography.captionStrong,
            { color: colors.text, marginBottom: spacing.xs },
          ]}
        >
          Bắt đầu
        </Text>
        <View style={styles.dateTimeRow}>
          <View style={styles.dateCol}>
            <Input
              placeholder="dd/mm/yyyy"
              value={startDate}
              onChangeText={(v) => setStartDate(formatDateInput(v))}
              keyboardType="number-pad"
              maxLength={10}
              hint="VD: 01/05/2026"
            />
          </View>
          <View style={styles.timeCol}>
            <Input
              placeholder="HH:mm"
              value={startTime}
              onChangeText={(v) => setStartTime(formatTimeInput(v))}
              keyboardType="number-pad"
              maxLength={5}
              hint="VD: 09:00"
            />
          </View>
        </View>

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
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
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

        <View style={{ marginTop: spacing.lg }}>
          <Input
            label="Mô tả"
            placeholder="Ghi chú thêm (tuỳ chọn)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: "top" }}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => setAdvancedOpen((v) => !v)}
          style={[
            styles.advancedToggle,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <Text style={[typography.bodyStrong, { color: colors.text }]}>Thêm tùy chọn</Text>
          <Ionicons
            name={advancedOpen ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.textMuted}
          />
        </Pressable>

        {advancedOpen && (
          <View
            style={[
              styles.advancedBox,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            <Text
              style={[
                typography.captionStrong,
                { color: colors.text, marginBottom: spacing.xs },
              ]}
            >
              Kết thúc
            </Text>
            <View style={styles.dateTimeRow}>
              <View style={styles.dateCol}>
                <Input
                  placeholder="dd/mm/yyyy"
                  value={endDate}
                  onChangeText={(v) => setEndDate(formatDateInput(v))}
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>
              <View style={styles.timeCol}>
                <Input
                  placeholder="HH:mm"
                  value={endTime}
                  onChangeText={(v) => setEndTime(formatTimeInput(v))}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>
            </View>

            <Text
              style={[
                typography.captionStrong,
                { color: colors.text, marginBottom: spacing.xs, marginTop: spacing.xs },
              ]}
            >
              Nhắc lúc
            </Text>
            <View style={styles.dateTimeRow}>
              <View style={styles.dateCol}>
                <Input
                  placeholder="dd/mm/yyyy"
                  value={remindDate}
                  onChangeText={(v) => setRemindDate(formatDateInput(v))}
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>
              <View style={styles.timeCol}>
                <Input
                  placeholder="HH:mm"
                  value={remindTime}
                  onChangeText={(v) => setRemindTime(formatTimeInput(v))}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>
            </View>

            <Text
              style={[
                typography.captionStrong,
                { color: colors.text, marginBottom: spacing.xs, marginTop: spacing.xs },
              ]}
            >
              Loại
            </Text>
            <View style={styles.optionWrap}>
              {ITEM_TYPES.map((t) => {
                const active = itemType === t;
                return (
                  <Pressable
                    key={t}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    onPress={() => setItemType(t)}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: active ? colors.primaryMuted : colors.card,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.body,
                        { color: active ? colors.primary : colors.text },
                      ]}
                    >
                      {ITEM_TYPE_LABEL_VI[t]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text
              style={[
                typography.captionStrong,
                { color: colors.text, marginBottom: spacing.xs, marginTop: spacing.xs },
              ]}
            >
              Lặp
            </Text>
            <View style={styles.optionWrap}>
              {RECURRENCES.map((r) => {
                const active = recurrence === r;
                return (
                  <Pressable
                    key={r}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    onPress={() => setRecurrence(r)}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: active ? colors.primaryMuted : colors.card,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.body,
                        { color: active ? colors.primary : colors.text },
                      ]}
                    >
                      {RECURRENCE_LABEL_VI[r]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

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
  dateTimeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dateCol: {
    flex: 1,
  },
  timeCol: {
    width: 110,
  },
  advancedToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  advancedBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  optionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  optionChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
  },
});
