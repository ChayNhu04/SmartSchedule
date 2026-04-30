import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, type ViewStyle } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { radius, spacing } from "../theme/tokens";

export function Skeleton({ style }: { style?: ViewStyle | ViewStyle[] }) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { backgroundColor: colors.surface, borderRadius: radius.sm, opacity },
        style,
      ]}
    />
  );
}

export function ScheduleCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.bar, { backgroundColor: colors.border }]} />
      <View style={{ paddingLeft: spacing.md, flex: 1 }}>
        <Skeleton style={{ width: 100, height: 12, marginBottom: 8 }} />
        <Skeleton style={{ width: "75%", height: 18, marginBottom: 8 }} />
        <Skeleton style={{ width: "50%", height: 14 }} />
      </View>
    </View>
  );
}

export function ScheduleListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={{ paddingHorizontal: spacing.lg }}>
      {Array.from({ length: count }).map((_, i) => (
        <ScheduleCardSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
    overflow: "hidden",
    position: "relative",
  },
  bar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
});
