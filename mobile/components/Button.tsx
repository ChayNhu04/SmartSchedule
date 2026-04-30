import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { radius, spacing, typography } from "../theme/tokens";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "md" | "lg";

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  leftIcon,
  fullWidth = true,
}: Props) {
  const { colors } = useTheme();

  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "destructive"
        ? colors.destructive
        : variant === "secondary"
          ? colors.surface
          : "transparent";
  const fg =
    variant === "primary"
      ? colors.primaryForeground
      : variant === "destructive"
        ? colors.destructiveForeground
        : variant === "ghost"
          ? colors.primary
          : colors.text;
  const border =
    variant === "secondary" ? colors.border : "transparent";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        size === "lg" && styles.lg,
        {
          backgroundColor: bg,
          borderColor: border,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={fg} size="small" />
        ) : (
          <>
            {leftIcon}
            <Text style={[typography.bodyStrong, { color: fg, marginLeft: leftIcon ? 8 : 0 }]}>
              {label}
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center",
  },
  lg: {
    paddingVertical: spacing.lg,
    minHeight: 52,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
