import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import { spacing, typography } from "../theme/tokens";

interface Props {
  title?: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: ("top" | "bottom" | "left" | "right")[];
}

export function Screen({ title, subtitle, rightSlot, children, style, edges = ["top"] }: Props) {
  const { colors, scheme } = useTheme();
  return (
    <SafeAreaView
      edges={edges}
      style={[{ flex: 1, backgroundColor: colors.background }, style]}
    >
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      {(title || rightSlot) && (
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            {title && <Text style={[typography.h1, { color: colors.text }]}>{title}</Text>}
            {subtitle && (
              <Text
                style={[typography.body, { color: colors.textMuted, marginTop: 2 }]}
              >
                {subtitle}
              </Text>
            )}
          </View>
          {rightSlot}
        </View>
      )}
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
});
