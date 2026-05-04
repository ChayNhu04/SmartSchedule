import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  ITEM_TYPES,
  ITEM_TYPE_LABEL_VI,
  RECURRENCES,
  RECURRENCE_LABEL_VI,
  type CreateScheduleRequest,
  type RecurrenceType,
  type Schedule,
  type SchedulePriority,
  type ScheduleItemType,
} from "@smartschedule/shared";
import { Input } from "./Input";
import { Button } from "./Button";
import { useTheme } from "../theme/ThemeContext";
import { radius, spacing, typography } from "../theme/tokens";
import {
  combineDateTime,
  formatDateInput,
  formatTimeInput,
  splitIsoToLocalParts,
} from "../lib/datetime";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Thấp", colorKey: "priorityLow" as const },
  { value: "normal", label: "Vừa", colorKey: "priorityNormal" as const },
  { value: "high", label: "Cao", colorKey: "priorityHigh" as const },
] as const;

interface Props {
  initial?: Schedule | null;
  submitLabel: string;
  onSubmit: (payload: CreateScheduleRequest) => Promise<void>;
}

export function ScheduleForm({ initial, submitLabel, onSubmit }: Props) {
  const { colors } = useTheme();

  const initialStart = useMemo(
    () => splitIsoToLocalParts(initial?.start_time),
    [initial?.start_time],
  );
  const initialEnd = useMemo(
    () => splitIsoToLocalParts(initial?.end_time),
    [initial?.end_time],
  );
  const initialRemind = useMemo(
    () => splitIsoToLocalParts(initial?.remind_at),
    [initial?.remind_at],
  );

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [startDate, setStartDate] = useState(initialStart.date);
  const [startTime, setStartTime] = useState(initialStart.time);
  const [endDate, setEndDate] = useState(initialEnd.date);
  const [endTime, setEndTime] = useState(initialEnd.time);
  const [remindDate, setRemindDate] = useState(initialRemind.date);
  const [remindTime, setRemindTime] = useState(initialRemind.time);
  const [priority, setPriority] = useState<SchedulePriority>(initial?.priority ?? "normal");
  const [itemType, setItemType] = useState<ScheduleItemType>(initial?.item_type ?? "task");
  const [recurrence, setRecurrence] = useState<RecurrenceType>(
    initial?.recurrence_type ?? "none",
  );
  const hasAdvanced =
    !!initial &&
    (!!initial.end_time ||
      !!initial.remind_at ||
      initial.item_type !== "task" ||
      initial.recurrence_type !== "none");
  const [advancedOpen, setAdvancedOpen] = useState(hasAdvanced);
  const [loading, setLoading] = useState(false);

  const startIso = useMemo(
    () => combineDateTime(startDate, startTime),
    [startDate, startTime],
  );
  const endIso = useMemo(() => combineDateTime(endDate, endTime), [endDate, endTime]);
  const remindIso = useMemo(
    () => combineDateTime(remindDate, remindTime),
    [remindDate, remindTime],
  );

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
      await onSubmit(payload);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      Alert.alert("Lỗi", e.response?.data?.message ?? e.message ?? "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
      <Input
        label="Tiêu đề"
        placeholder="VD: Họp team product"
        value={title}
        onChangeText={setTitle}
      />

      <Text
        style={[typography.captionStrong, { color: colors.text, marginBottom: spacing.xs }]}
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
            style={[typography.captionStrong, { color: colors.text, marginBottom: spacing.xs }]}
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
        <Button label={submitLabel} onPress={submit} loading={loading} size="lg" />
      </View>
    </ScrollView>
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
