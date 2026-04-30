import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme/ThemeContext";
import { radius, spacing, typography } from "../../theme/tokens";
import { api } from "../../services/api";
import { useAuthStore } from "../../hooks/useAuthStore";

export default function RegisterScreen() {
  const { colors, scheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const submit = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", {
        email,
        password,
        display_name: displayName || undefined,
      });
      await setAuth(data.access_token, data.user);
      router.replace("/(tabs)");
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      Alert.alert("Đăng ký thất bại", e.response?.data?.message ?? e.message ?? "Lỗi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: spacing["2xl"], justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandRow}>
            <View style={[styles.logoBox, { backgroundColor: colors.primary }]}>
              <Ionicons name="sparkles" size={20} color={colors.primaryForeground} />
            </View>
            <Text style={[typography.h2, { color: colors.text }]}>SmartSchedule</Text>
          </View>

          <Text style={[typography.display, { color: colors.text, marginTop: spacing["3xl"] }]}>
            Tạo tài khoản
          </Text>
          <Text
            style={[
              typography.bodyLg,
              { color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing["2xl"] },
            ]}
          >
            Bắt đầu quản lý lịch — miễn phí.
          </Text>

          <Input
            label="Tên hiển thị"
            placeholder="Nguyễn Văn A"
            value={displayName}
            onChangeText={setDisplayName}
            leftIcon={<Ionicons name="person-outline" size={18} color={colors.textMuted} />}
          />
          <Input
            label="Email"
            placeholder="ban@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textMuted} />}
          />
          <Input
            label="Mật khẩu"
            placeholder="Tối thiểu 6 ký tự"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
            hint="Tối thiểu 6 ký tự"
          />
          <View style={{ marginTop: spacing.sm }}>
            <Button label="Tạo tài khoản" onPress={submit} loading={loading} size="lg" />
          </View>

          <Pressable
            onPress={() => router.back()}
            style={{ marginTop: spacing.xl, alignItems: "center" }}
          >
            <Text style={[typography.body, { color: colors.textMuted }]}>
              Đã có tài khoản?{" "}
              <Link href="/(auth)/login" style={{ color: colors.primary, fontWeight: "600" }}>
                Đăng nhập
              </Link>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
