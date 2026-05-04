import { useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { parseScheduleText } from "@smartschedule/shared";
import { useTheme } from "../theme/ThemeContext";
import { elevation, radius, spacing, typography } from "../theme/tokens";
import { api } from "../services/api";
import { bucketForStartTime } from "../lib/schedule-bucket";

const EXAMPLE = 'vd: "mai 9h họp scrum"';

function pickError(err: unknown, fallback: string): string {
  const e = err as {
    response?: { data?: { message?: string | string[] } };
    message?: string;
  };
  const msg = e?.response?.data?.message ?? e?.message;
  if (Array.isArray(msg)) return msg[0] || fallback;
  return msg || fallback;
}

export function QuickAdd() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const [text, setText] = useState("");

  const parsed = useMemo(() => {
    if (!text.trim()) return null;
    return parseScheduleText(text);
  }, [text]);

  const createMut = useMutation({
    mutationFn: async () => {
      if (!parsed) throw new Error("Chưa có nội dung");
      return api.post("/schedules", {
        title: parsed.title,
        start_time: parsed.start_time,
        end_time: parsed.end_time,
        item_type: "task",
        priority: "normal",
      });
    },
    onSuccess: () => {
      Keyboard.dismiss();
      const iso = parsed?.start_time;
      qc.invalidateQueries({ queryKey: ["schedules"] });
      setText("");
      if (iso) {
        const b = bucketForStartTime(iso);
        // If user is already on the right tab the toast/Alert is noisy; we
        // simply nav them there which makes the new card visible.
        if (b.tabPath !== "/(tabs)") {
          router.push(b.tabPath as never);
        }
      }
    },
    onError: (err) => {
      Alert.alert("Lỗi", pickError(err, "Không thể tạo lịch"));
    },
  });

  const previewLine = parsed
    ? `${parsed.title} — ${format(new Date(parsed.start_time), "EEE, dd/MM 'lúc' HH:mm", { locale: vi })}`
    : null;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        elevation.soft,
      ]}
    >
      <View style={styles.headerRow}>
        <Ionicons name="sparkles-outline" size={14} color={colors.primary} />
        <Text style={[typography.captionStrong, { color: colors.textMuted }]}>
          Thêm nhanh
        </Text>
      </View>
      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={EXAMPLE}
          placeholderTextColor={colors.textSubtle}
          style={[
            styles.input,
            {
              color: colors.text,
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
            typography.body,
          ]}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={() => parsed && createMut.mutate()}
        />
        <Pressable
          accessibilityRole="button"
          disabled={!parsed || createMut.isPending}
          onPress={() => createMut.mutate()}
          style={({ pressed }) => [
            styles.addBtn,
            {
              backgroundColor:
                !parsed || createMut.isPending
                  ? colors.surface
                  : colors.primary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons
            name="arrow-forward"
            size={18}
            color={!parsed || createMut.isPending ? colors.textSubtle : "#fff"}
          />
        </Pressable>
      </View>
      {previewLine && (
        <View style={{ marginTop: spacing.xs }}>
          <Text
            style={[typography.caption, { color: colors.textMuted }]}
            numberOfLines={2}
          >
            <Text style={[typography.captionStrong, { color: colors.text }]}>
              Sẽ tạo:
            </Text>{" "}
            {previewLine}
          </Text>
          {parsed?.inferred && parsed.inferred.length > 0 && (
            <Text
              style={[
                typography.caption,
                { color: colors.warning, marginTop: 2 },
              ]}
              numberOfLines={2}
            >
              {parsed.inferred.join("; ")}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 40,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
