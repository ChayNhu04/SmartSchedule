import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format, isPast, isToday } from "date-fns";
import { vi } from "date-fns/locale";
import { useTheme } from "../theme/ThemeContext";
import { elevation, radius, spacing, typography } from "../theme/tokens";
import type { Schedule } from "../types/schedule";

const PRIORITY_LABEL: Record<string, string> = {
  low: "Thấp",
  normal: "Vừa",
  high: "Cao",
};

export function ScheduleCard({
  schedule,
  onPress,
}: {
  schedule: Schedule;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const start = new Date(schedule.start_time);
  const end = schedule.end_time ? new Date(schedule.end_time) : null;

  const priorityColor =
    schedule.priority === "high"
      ? colors.priorityHigh
      : schedule.priority === "low"
        ? colors.priorityLow
        : colors.priorityNormal;

  const priorityBg =
    schedule.priority === "high"
      ? colors.destructiveMuted
      : schedule.priority === "low"
        ? colors.successMuted
        : colors.warningMuted;

  const isDone = schedule.status === "completed";
  const isCancelled = schedule.status === "cancelled";
  const isOverdue = schedule.status === "pending" && isPast(start);

  const dateLabel = isToday(start)
    ? "Hôm nay"
    : format(start, "EEE, d MMM", { locale: vi });
  const timeLabel = format(start, "HH:mm");
  const endLabel = end ? format(end, "HH:mm") : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: isDone || isCancelled ? 0.7 : pressed ? 0.96 : 1,
        },
        elevation.soft,
      ]}
    >
      <View style={[styles.bar, { backgroundColor: priorityColor }]} />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            {dateLabel} · {timeLabel}
            {endLabel ? ` – ${endLabel}` : ""}
          </Text>
          <View
            style={[
              styles.priorityChip,
              { backgroundColor: priorityBg },
            ]}
          >
            <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
            <Text
              style={[
                typography.captionStrong,
                { color: priorityColor },
              ]}
            >
              {PRIORITY_LABEL[schedule.priority] ?? "Vừa"}
            </Text>
          </View>
        </View>

        <Text
          style={[
            typography.h3,
            {
              color: colors.text,
              textDecorationLine: isDone ? "line-through" : "none",
            },
          ]}
          numberOfLines={2}
        >
          {schedule.title}
        </Text>

        {schedule.description ? (
          <Text
            style={[typography.body, { color: colors.textMuted, marginTop: 4 }]}
            numberOfLines={2}
          >
            {schedule.description}
          </Text>
        ) : null}

        {(isDone ||
          isCancelled ||
          isOverdue ||
          schedule.recurrence_type !== "none" ||
          (schedule.tags && schedule.tags.length > 0)) && (
          <View style={styles.badgesRow}>
            {isDone && (
              <Badge color={colors.success} bg={colors.successMuted} icon="checkmark-circle">
                Hoàn thành
              </Badge>
            )}
            {isCancelled && (
              <Badge color={colors.textMuted} bg={colors.surface} icon="close-circle">
                Đã huỷ
              </Badge>
            )}
            {isOverdue && (
              <Badge
                color={colors.destructive}
                bg={colors.destructiveMuted}
                icon="alert-circle"
              >
                Quá hạn
              </Badge>
            )}
            {schedule.recurrence_type !== "none" && (
              <Badge color={colors.textMuted} bg={colors.surface} icon="repeat">
                Lặp lại
              </Badge>
            )}
            {schedule.tags?.map((t) => (
              <View
                key={t.id}
                style={[
                  styles.tagChip,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Text
                  style={[typography.captionStrong, { color: colors.textMuted }]}
                >
                  #{t.name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

function Badge({
  children,
  color,
  bg,
  icon,
}: {
  children: string;
  color: string;
  bg: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={[typography.captionStrong, { color, marginLeft: 4 }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  bar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  priorityChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    marginRight: 5,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: spacing.sm,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  tagChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
});
