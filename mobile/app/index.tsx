import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../hooks/useAuthStore";

export default function Index() {
  const { token, hydrate } = useAuthStore();

  useEffect(() => {
    (async () => {
      await hydrate();
      router.replace(token ? "/(tabs)" : "/(auth)/login");
    })();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
