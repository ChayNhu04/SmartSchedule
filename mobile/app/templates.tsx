import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ScheduleTemplate } from "@smartschedule/shared";
import { Screen } from "../components/Screen";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { useTheme } from "../theme/ThemeContext";
import { elevation, radius, spacing, typography } from "../theme/tokens";
import { api } from "../services/api";
import { combineDateTime, formatDateInput, formatTimeInput } from "../lib/datetime";
import { bucketForStartTime } from "../lib/schedule-bucket";

interface PresetTemplate {
  name: string;
  title: string;
  duration_minutes: number;
  emoji: string;
}

const PRESET_TEMPLATES: PresetTemplate[] = [
  { name: "hop-tuan", title: "Họp tuần với team", duration_minutes: 60, emoji: "👥" },
  { name: "review-sprint", title: "Sprint review", duration_minutes: 90, emoji: "🧭" },
  { name: "uong-thuoc", title: "Nhắc uống thuốc", duration_minutes: 5, emoji: "💊" },
  { name: "gym", title: "Tập gym", duration_minutes: 60, emoji: "🏋️" },
];

function pickError(err: unknown, fallback: string): string {
  const e = err as {
    response?: { data?: { message?: string | string[] } };
    message?: string;
  };
  const msg = e?.response?.data?.message ?? e?.message;
  if (Array.isArray(msg)) return msg[0] || fallback;
  return msg || fallback;
}

export default function TemplatesScreen() {
  const { colors } = useTheme();
  const qc = useQueryClient();

  // Create-template form state
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("60");

  // Instantiate modal state
  const [instOpen, setInstOpen] = useState(false);
  const [instName, setInstName] = useState("");
  const [instDate, setInstDate] = useState("");
  const [instTime, setInstTime] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: async () =>
      (await api.get<ScheduleTemplate[]>("/templates")).data,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const dur = parseInt(duration, 10);
      return api.post("/templates", {
        name: name.trim(),
        title: title.trim(),
        duration_minutes: dur > 0 ? dur : undefined,
      });
    },
    onSuccess: () => {
      setName("");
      setTitle("");
      qc.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: (err) => Alert.alert("Lỗi tạo mẫu", pickError(err, "Vui lòng thử lại")),
  });

  const createPresetMut = useMutation({
    mutationFn: async (p: PresetTemplate) =>
      api.post("/templates", {
        name: p.name,
        title: p.title,
        duration_minutes: p.duration_minutes,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
    onError: (err) =>
      Alert.alert("Lỗi", pickError(err, "Không thể thêm mẫu gợi ý")),
  });

  const deleteMut = useMutation({
    mutationFn: async (n: string) => api.delete(`/templates/${n}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
    onError: () => Alert.alert("Lỗi", "Không thể xoá mẫu"),
  });

  const instMut = useMutation({
    mutationFn: async () => {
      const iso = combineDateTime(instDate, instTime);
      if (!iso) throw new Error("Ngày hoặc giờ không hợp lệ");
      return api
        .post(`/templates/${instName}/instantiate`, { start_time: iso })
        .then(() => iso);
    },
    onSuccess: (iso) => {
      qc.invalidateQueries({ queryKey: ["schedules"] });
      setInstOpen(false);
      const bucket = bucketForStartTime(iso);
      // Navigate so user sees the new schedule (today/upcoming/overdue).
      router.replace(bucket.tabPath as never);
    },
    onError: (err) => Alert.alert("Lỗi", pickError(err, "Không thể tạo lịch")),
  });

  const confirmDelete = (n: string) => {
    Alert.alert(
      "Xoá mẫu này?",
      `Mẫu "${n}" sẽ bị xoá. Lịch đã tạo từ mẫu vẫn giữ nguyên.`,
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Xoá",
          style: "destructive",
          onPress: () => deleteMut.mutate(n),
        },
      ],
    );
  };

  const openInstantiate = (n: string) => {
    setInstName(n);
    setInstDate("");
    setInstTime("");
    setInstOpen(true);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Mẫu lịch",
          headerTintColor: colors.text,
          headerStyle: { backgroundColor: colors.background },
        }}
      />
      <Screen edges={["bottom"]}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
          <Text style={[typography.body, { color: colors.textMuted }]}>
            Lưu mẫu để nhân bản nhanh thành lịch mới.
          </Text>

          {/* Create form */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
              elevation.soft,
            ]}
          >
            <Text
              style={[
                typography.captionStrong,
                {
                  color: colors.textMuted,
                  marginBottom: spacing.sm,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                },
              ]}
            >
              Tạo mẫu mới
            </Text>
            <Input
              label="Tên mẫu"
              hint="a-z, 0-9, '-' hoặc '_'. VD: hop-tuan"
              value={name}
              onChangeText={setName}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Input
              label="Tiêu đề lịch"
              placeholder="VD: Họp tuần với team"
              value={title}
              onChangeText={setTitle}
            />
            <Input
              label="Thời lượng (phút)"
              hint="Để trống = 60"
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
            />
            <Button
              label="Tạo mẫu"
              onPress={() => createMut.mutate()}
              loading={createMut.isPending}
              disabled={!name.trim() || !title.trim() || createMut.isPending}
            />
          </View>

          {/* List or empty state */}
          {isLoading && !data ? (
            <ActivityIndicator color={colors.primary} />
          ) : (data?.length ?? 0) === 0 ? (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderStyle: "dashed",
                },
              ]}
            >
              <Text
                style={[
                  typography.h3,
                  { color: colors.text, marginBottom: 4 },
                ]}
              >
                Chưa có mẫu nào
              </Text>
              <Text
                style={[
                  typography.caption,
                  { color: colors.textMuted, marginBottom: spacing.md },
                ]}
              >
                Bấm một gợi ý dưới đây để thử ngay, hoặc tự tạo mẫu ở khung trên.
              </Text>
              <View style={{ gap: spacing.sm }}>
                {PRESET_TEMPLATES.map((p) => (
                  <Pressable
                    key={p.name}
                    onPress={() => createPresetMut.mutate(p)}
                    disabled={createPresetMut.isPending}
                    style={({ pressed }) => [
                      styles.presetRow,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        opacity: pressed || createPresetMut.isPending ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 24 }}>{p.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[typography.bodyStrong, { color: colors.text }]}
                      >
                        {p.title}
                      </Text>
                      <Text
                        style={[
                          typography.caption,
                          { color: colors.textMuted, marginTop: 2 },
                        ]}
                      >
                        {p.duration_minutes} phút · &quot;{p.name}&quot;
                      </Text>
                    </View>
                    <Ionicons
                      name="add-circle"
                      size={20}
                      color={colors.primary}
                    />
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {data!.map((t) => (
                <View
                  key={t.id}
                  style={[
                    styles.card,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    elevation.soft,
                  ]}
                >
                  <Text style={[typography.h3, { color: colors.text }]}>
                    {t.name}
                  </Text>
                  <Text
                    style={[
                      typography.body,
                      {
                        color: colors.textMuted,
                        marginTop: 2,
                        marginBottom: spacing.sm,
                      },
                    ]}
                  >
                    {t.title}
                  </Text>
                  {t.duration_minutes ? (
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: colors.textSubtle,
                          marginBottom: spacing.md,
                        },
                      ]}
                    >
                      Thời lượng: {t.duration_minutes} phút
                    </Text>
                  ) : null}
                  <View style={styles.actionsRow}>
                    <View style={{ flex: 1 }}>
                      <Button
                        label="Tạo lịch"
                        leftIcon={
                          <Ionicons
                            name="sparkles"
                            size={14}
                            color={colors.primaryForeground}
                          />
                        }
                        onPress={() => openInstantiate(t.name)}
                      />
                    </View>
                    <Pressable
                      onPress={() => confirmDelete(t.name)}
                      hitSlop={8}
                      style={[
                        styles.deleteBtn,
                        { borderColor: colors.border },
                      ]}
                      accessibilityLabel={`Xoá mẫu ${t.name}`}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={colors.destructive}
                      />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </Screen>

      {/* Instantiate modal */}
      <Modal
        visible={instOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setInstOpen(false)}
      >
        <View
          style={[
            styles.modalBackdrop,
            { backgroundColor: colors.overlay },
          ]}
        >
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: colors.background },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[typography.h2, { color: colors.text }]}>
                Tạo lịch từ mẫu
              </Text>
              <Pressable
                onPress={() => setInstOpen(false)}
                hitSlop={8}
                accessibilityLabel="Đóng"
              >
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </Pressable>
            </View>
            <Text
              style={[
                typography.caption,
                {
                  color: colors.textMuted,
                  marginBottom: spacing.md,
                },
              ]}
            >
              Mẫu &quot;{instName}&quot;
            </Text>

            <Text
              style={[
                typography.captionStrong,
                {
                  color: colors.text,
                  marginBottom: spacing.xs,
                },
              ]}
            >
              Bắt đầu
            </Text>
            <View style={styles.dateTimeRow}>
              <View style={{ flex: 2 }}>
                <Input
                  placeholder="dd/mm/yyyy"
                  value={instDate}
                  onChangeText={(v) => setInstDate(formatDateInput(v))}
                  keyboardType="number-pad"
                  maxLength={10}
                  hint="VD: 01/05/2026"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  placeholder="HH:mm"
                  value={instTime}
                  onChangeText={(v) => setInstTime(formatTimeInput(v))}
                  keyboardType="number-pad"
                  maxLength={5}
                  hint="VD: 09:00"
                />
              </View>
            </View>

            <Button
              label="Tạo lịch"
              onPress={() => instMut.mutate()}
              loading={instMut.isPending}
              disabled={!instDate || !instTime || instMut.isPending}
            />
            <View style={{ height: spacing.sm }} />
            <Button
              label="Huỷ"
              variant="ghost"
              onPress={() => setInstOpen(false)}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  presetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  deleteBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing["2xl"],
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
