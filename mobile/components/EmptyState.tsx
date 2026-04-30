import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { radius, spacing, typography } from "../theme/tokens";

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.card }]}>
        <Ionicons name={icon} size={32} color={colors.textMuted} />
      </View>
      <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.xs }]}>
        {title}
      </Text>
      {description && (
        <Text
          style={[
            typography.body,
            { color: colors.textMuted, textAlign: "center", maxWidth: 320 },
          ]}
        >
          {description}
        </Text>
      )}
      {action && <View style={{ marginTop: spacing.lg }}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing["4xl"],
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderStyle: "dashed",
    margin: spacing.lg,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
});
