import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { radius, spacing, typography } from "../theme/tokens";

const OPTIONS = [
  { value: "light", icon: "sunny", label: "Sáng" },
  { value: "system", icon: "phone-portrait", label: "Auto" },
  { value: "dark", icon: "moon", label: "Tối" },
] as const;

export function ThemeToggle() {
  const { mode, setMode, colors } = useTheme();

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {OPTIONS.map((opt) => {
        const active = mode === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => setMode(opt.value)}
            style={[
              styles.option,
              active && { backgroundColor: colors.card },
            ]}
          >
            <Ionicons
              name={opt.icon}
              size={16}
              color={active ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                typography.captionStrong,
                {
                  color: active ? colors.text : colors.textMuted,
                  marginLeft: 6,
                },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    padding: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 2,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
});
