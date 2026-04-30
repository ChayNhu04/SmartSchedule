import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "#1f6feb" }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Hôm nay",
          tabBarIcon: ({ color, size }) => <Ionicons name="today" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="upcoming"
        options={{
          title: "Sắp tới",
          tabBarIcon: ({ color, size }) => <Ionicons name="time" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Thêm",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" color={color} size={size + 8} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Tìm",
          tabBarIcon: ({ color, size }) => <Ionicons name="search" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Cài đặt",
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
