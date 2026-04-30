import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuthStore } from "../../hooks/useAuthStore";

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();

  const onLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Cài đặt</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Tài khoản</Text>
        <Text style={styles.value}>{user?.email}</Text>
        {user?.display_name ? <Text style={styles.value}>{user.display_name}</Text> : null}
      </View>
      <Pressable style={styles.button} onPress={onLogout}>
        <Text style={styles.buttonText}>Đăng xuất</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7f8", padding: 16 },
  heading: { fontSize: 24, fontWeight: "700", marginBottom: 16 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  label: { color: "#666", fontSize: 12 },
  value: { fontSize: 16, marginTop: 4 },
  button: {
    backgroundColor: "#dc2626",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
});
