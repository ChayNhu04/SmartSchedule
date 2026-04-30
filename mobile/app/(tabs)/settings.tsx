import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../../components/Screen";
import { Button } from "../../components/Button";
import { ThemeToggle } from "../../components/ThemeToggle";
import { useTheme } from "../../theme/ThemeContext";
import { elevation, radius, spacing, typography } from "../../theme/tokens";
import { useAuthStore } from "../../hooks/useAuthStore";

function initials(input?: string | null) {
  if (!input) return "?";
  const parts = input.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "?";
}

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const { colors } = useTheme();

  const onLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  const displayName = user?.display_name || user?.email?.split("@")[0] || "User";

  return (
    <Screen title="Cài đặt">
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
            elevation.soft,
          ]}
        >
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryMuted }]}>
              <Text style={[typography.h2, { color: colors.primary }]}>
                {initials(user?.display_name ?? user?.email)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.h3, { color: colors.text }]}>{displayName}</Text>
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                {user?.email}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
            elevation.soft,
          ]}
        >
          <Text style={[typography.captionStrong, { color: colors.textMuted, marginBottom: spacing.sm, textTransform: "uppercase", letterSpacing: 0.5 }]}>
            Giao diện
          </Text>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyStrong, { color: colors.text }]}>Chế độ màu</Text>
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                Tự động theo hệ thống hoặc chọn thủ công.
              </Text>
            </View>
            <ThemeToggle />
          </View>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
            elevation.soft,
          ]}
        >
          <Text style={[typography.captionStrong, { color: colors.textMuted, marginBottom: spacing.sm, textTransform: "uppercase", letterSpacing: 0.5 }]}>
            Về SmartSchedule
          </Text>
          <View style={styles.aboutRow}>
            <Ionicons name="sparkles" size={18} color={colors.primary} />
            <Text style={[typography.body, { color: colors.text, marginLeft: spacing.sm }]}>
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
  aboutRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});
