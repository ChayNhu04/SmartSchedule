import { useEffect, useRef } from "react";
import { Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useTheme } from "../../theme/ThemeContext";
import { useAuthStore } from "../../hooks/useAuthStore";
import { registerForPushNotificationsAsync } from "../../services/notifications";

function navigateToSchedule(scheduleId: unknown) {
  if (typeof scheduleId !== "string" && typeof scheduleId !== "number") return;
  router.push(`/schedule/${scheduleId}` as never);
}

export default function TabsLayout() {
  const { colors } = useTheme();
  const token = useAuthStore((s) => s.token);
  const handledColdStart = useRef(false);

  useEffect(() => {
    if (!token) return;

    // Đăng ký Expo push token với backend (fire-and-forget; permissions denied
    // hoặc lỗi mạng chỉ trả null/swallowed bên trong helper).
    registerForPushNotificationsAsync().catch(() => {});

    // Tap khi app đang chạy: navigate tới màn chi tiết lịch.
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as
          | { schedule_id?: string | number }
          | undefined;
        navigateToSchedule(data?.schedule_id);
      },
    );

    // Cold start: app được mở bằng cách tap notification khi chưa chạy.
    if (!handledColdStart.current) {
      handledColdStart.current = true;
      Notifications.getLastNotificationResponseAsync()
        .then((response) => {
          if (!response) return;
          const data = response.notification.request.content.data as
            | { schedule_id?: string | number }
            | undefined;
          navigateToSchedule(data?.schedule_id);
        })
        .catch(() => {});
    }

    return () => sub.remove();
  }, [token]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Hôm nay",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="today-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="upcoming"
        options={{
          title: "Sắp tới",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Thêm",
          tabBarIcon: ({ color }) => (
            <Ionicons name="add-circle" color={color} size={32} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Tìm",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Cài đặt",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
