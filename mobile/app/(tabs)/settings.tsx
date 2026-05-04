import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserSettings } from "@smartschedule/shared";
import { Screen } from "../../components/Screen";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { ThemeToggle } from "../../components/ThemeToggle";
import { useTheme } from "../../theme/ThemeContext";
import { elevation, radius, spacing, typography } from "../../theme/tokens";
import { useAuthStore } from "../../hooks/useAuthStore";
import { api } from "../../services/api";

function initials(input?: string | null) {
  if (!input) return "?";
  const parts = input.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "?";
}

function clampHour(input: string): number {
  const n = parseInt(input, 10);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(23, n));
}

function clampRemind(input: string): number {
  const n = parseInt(input, 10);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(720, n));
}

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const { colors } = useTheme();
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["user-settings"],
    queryFn: async () =>
      (await api.get<UserSettings>("/users/me/settings")).data,
  });

  const [timezone, setTimezone] = useState("Asia/Ho_Chi_Minh");
  const [defaultRemind, setDefaultRemind] = useState("30");
  const [notifyPush, setNotifyPush] = useState(true);
  const [workStart, setWorkStart] = useState("8");
  const [workEnd, setWorkEnd] = useState("17");

  useEffect(() => {
    if (settings) {
      setTimezone(settings.timezone);
      setDefaultRemind(String(settings.default_remind_minutes));
      setNotifyPush(settings.notify_via_push);
      setWorkStart(String(settings.work_start_hour));
      setWorkEnd(String(settings.work_end_hour));
    }
  }, [settings]);

  const workStartNum = clampHour(workStart);
  const workEndNum = clampHour(workEnd);
  const workHoursError =
    workEndNum <= workStartNum
      ? "Giờ kết thúc phải lớn hơn giờ bắt đầu"
      : null;

  const mut = useMutation({
    mutationFn: async () => {
      if (workHoursError) {
        throw new Error(workHoursError);
      }
      return api.patch("/users/me/settings", {
        timezone: timezone.trim() || "Asia/Ho_Chi_Minh",
        default_remind_minutes: clampRemind(defaultRemind),
        notify_via_push: notifyPush,
        work_start_hour: workStartNum,
        work_end_hour: workEndNum,
      });
    },
    onSuccess: () => {
      Alert.alert("Đã lưu", "Cài đặt đã được cập nhật");
      qc.invalidateQueries({ queryKey: ["user-settings"] });
    },
    onError: (err: Error) => {
      Alert.alert("Lỗi", err.message || "Không thể lưu cài đặt");
    },
  });

  const onLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  const displayName =
    user?.display_name || user?.email?.split("@")[0] || "User";

  return (
    <Screen title="Cài đặt">
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
      >
        {/* Profile card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
            elevation.soft,
          ]}
        >
          <View style={styles.profileRow}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: colors.primaryMuted },
              ]}
            >
              <Text style={[typography.h2, { color: colors.primary }]}>
                {initials(user?.display_name ?? user?.email)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.h3, { color: colors.text }]}>
                {displayName}
              </Text>
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                {user?.email}
              </Text>
            </View>
          </View>
        </View>

        {/* Theme card */}
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
            Giao diện
          </Text>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyStrong, { color: colors.text }]}>
                Chế độ màu
              </Text>
              <Text
                style={[
                  typography.caption,
                  { color: colors.textMuted, marginTop: 2 },
                ]}
              >
                Tự động theo hệ thống hoặc chọn thủ công.
              </Text>
            </View>
            <ThemeToggle />
          </View>
        </View>

        {/* Tuỳ chọn (preferences) card */}
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
            Tuỳ chọn
          </Text>
          <Text
            style={[
              typography.caption,
              { color: colors.textMuted, marginBottom: spacing.md },
            ]}
          >
            Khung giờ làm việc — reminder ngoài khung sẽ dồn về sáng hôm sau.
          </Text>

          {isLoading && !settings ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <View style={[styles.settingRow, { marginBottom: spacing.md }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyStrong, { color: colors.text }]}>
                    Bật thông báo đẩy
                  </Text>
                  <Text
                    style={[
                      typography.caption,
                      { color: colors.textMuted, marginTop: 2 },
                    ]}
                  >
                    Nhận push khi đến giờ nhắc.
                  </Text>
                </View>
                <Switch
                  value={notifyPush}
                  onValueChange={setNotifyPush}
                  trackColor={{
                    false: colors.border,
                    true: colors.primary,
                  }}
                  thumbColor={colors.card}
                />
              </View>

              <Input
                label="Múi giờ (IANA)"
                hint="Ví dụ: Asia/Ho_Chi_Minh"
                value={timezone}
                onChangeText={setTimezone}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Input
                label="Số phút nhắc trước (mặc định)"
                hint="0–720 phút"
                value={defaultRemind}
                onChangeText={setDefaultRemind}
                keyboardType="number-pad"
              />

              <View style={styles.hourRow}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Bắt đầu giờ làm việc"
                    hint="0–23"
                    value={workStart}
                    onChangeText={setWorkStart}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Kết thúc giờ làm việc"
                    hint="0–23"
                    value={workEnd}
                    onChangeText={setWorkEnd}
                    keyboardType="number-pad"
                    error={workHoursError ?? undefined}
                  />
                </View>
              </View>

              <Button
                label="Lưu cài đặt"
                onPress={() => mut.mutate()}
                loading={mut.isPending}
                disabled={mut.isPending || !!workHoursError}
              />
            </>
          )}
        </View>

        {/* Manage links card */}
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
            Quản lý
          </Text>
          <Pressable
            onPress={() => router.push("/tags" as never)}
            style={({ pressed }) => [
              styles.linkRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            accessibilityLabel="Mở trang quản lý nhãn"
          >
            <View
              style={[
                styles.linkIconWrap,
                { backgroundColor: colors.primaryMuted },
              ]}
            >
              <Ionicons
                name="pricetags-outline"
                size={18}
                color={colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyStrong, { color: colors.text }]}>
                Nhãn
              </Text>
              <Text
                style={[
                  typography.caption,
                  { color: colors.textMuted, marginTop: 2 },
                ]}
              >
                Tạo và quản lý nhãn để phân loại lịch.
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textSubtle}
            />
          </Pressable>

          <View
            style={{
              height: 1,
              backgroundColor: colors.border,
              marginVertical: spacing.md,
            }}
          />

          <Pressable
            onPress={() => router.push("/templates" as never)}
            style={({ pressed }) => [
              styles.linkRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            accessibilityLabel="Mở trang mẫu lịch"
          >
            <View
              style={[
                styles.linkIconWrap,
                { backgroundColor: colors.primaryMuted },
              ]}
            >
              <Ionicons name="copy-outline" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyStrong, { color: colors.text }]}>
                Mẫu lịch
              </Text>
              <Text
                style={[
                  typography.caption,
                  { color: colors.textMuted, marginTop: 2 },
                ]}
              >
                Lưu mẫu để nhân bản nhanh thành lịch mới.
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textSubtle}
            />
          </Pressable>
        </View>

        {/* About card */}
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
            Về SmartSchedule
          </Text>
          <View style={styles.aboutRow}>
            <Ionicons name="sparkles" size={18} color={colors.primary} />
            <Text
              style={[
                typography.body,
                { color: colors.text, marginLeft: spacing.sm },
              ]}
            >
              Phiên bản 0.1.0
            </Text>
          </View>
        </View>

        <Button label="Đăng xuất" onPress={onLogout} variant="destructive" />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  hourRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  aboutRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  linkIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
