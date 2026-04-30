import { forwardRef, useState } from "react";
import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { radius, spacing, typography } from "../theme/tokens";

interface Props extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<TextInput, Props>(function Input(
  { label, hint, error, leftIcon, style, onFocus, onBlur, ...rest },
  ref,
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ marginBottom: spacing.md }}>
      {label && (
        <Text style={[typography.captionStrong, { color: colors.text, marginBottom: spacing.xs }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.row,
          {
            backgroundColor: colors.card,
            borderColor: error
              ? colors.destructive
              : focused
                ? colors.primary
                : colors.border,
          },
        ]}
      >
        {leftIcon && <View style={{ marginRight: spacing.sm }}>{leftIcon}</View>}
        <TextInput
          ref={ref}
          {...rest}
          placeholderTextColor={colors.textSubtle}
          style={[
            styles.input,
            { color: colors.text },
            typography.bodyLg,
            style,
          ]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
      </View>
      {hint && !error && (
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
          {hint}
        </Text>
      )}
      {error && (
        <Text style={[typography.caption, { color: colors.destructive, marginTop: spacing.xs }]}>
          {error}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
});
