import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tag } from "@smartschedule/shared";
import { Screen } from "../components/Screen";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { useTheme } from "../theme/ThemeContext";
import { elevation, radius, spacing, typography } from "../theme/tokens";
import { api } from "../services/api";

export default function TagsScreen() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const [name, setName] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => (await api.get<Tag[]>("/tags")).data,
  });

  const createMut = useMutation({
    mutationFn: async () => api.post("/tags", { name: name.trim() }),
    onSuccess: () => {
      setName("");
      qc.invalidateQueries({ queryKey: ["tags"] });
    },
    onError: () => {
      Alert.alert(
        "Tên nhãn không hợp lệ",
        "Chỉ dùng chữ thường, số, dấu '-' hoặc '_'.",
      );
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (n: string) => api.delete(`/tags/${n}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
    onError: () => Alert.alert("Lỗi", "Không thể xoá nhãn"),
  });

  const confirmDelete = (n: string) => {
    Alert.alert(
      "Xoá nhãn này?",
      `Nhãn "${n}" sẽ bị xoá và gỡ khỏi tất cả lịch đang dùng.`,
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Xoá",
          style: "destructive",
          onPress: () => deleteMut.mutate(n),
        },
      ],
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Nhãn",
          headerTintColor: colors.text,
          headerStyle: { backgroundColor: colors.background },
        }}
      />
      <Screen edges={["bottom"]}>
        <View style={{ padding: spacing.lg, gap: spacing.lg, flex: 1 }}>
          <Text style={[typography.body, { color: colors.textMuted }]}>
            Quản lý các nhãn để phân loại lịch.
          </Text>

          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
              elevation.soft,
            ]}
          >
            <Input
              label="Tên nhãn mới"
              hint="Chỉ chữ thường, số, '-' hoặc '_'"
              value={name}
              onChangeText={setName}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={() => {
                if (name.trim()) createMut.mutate();
              }}
            />
            <Button
              label="Thêm nhãn"
              onPress={() => createMut.mutate()}
              loading={createMut.isPending}
              disabled={!name.trim() || createMut.isPending}
            />
          </View>

          {isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (data?.length ?? 0) === 0 ? (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons
                name="pricetags-outline"
                size={32}
                color={colors.textSubtle}
              />
              <Text
                style={[
                  typography.bodyStrong,
                  {
                    color: colors.text,
                    marginTop: spacing.sm,
                    textAlign: "center",
                  },
                ]}
              >
                Chưa có nhãn nào
              </Text>
              <Text
                style={[
                  typography.caption,
                  {
                    color: colors.textMuted,
                    marginTop: 4,
                    textAlign: "center",
                  },
                ]}
              >
                Tạo nhãn đầu tiên để phân loại lịch của bạn.
              </Text>
            </View>
          ) : (
            <FlatList
              data={data}
              keyExtractor={(t) => String(t.id)}
              ItemSeparatorComponent={() => (
                <View style={{ height: spacing.sm }} />
              )}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.row,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                    elevation.soft,
                  ]}
                >
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: item.color ?? colors.primary,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      typography.bodyStrong,
                      { color: colors.text, flex: 1 },
                    ]}
                  >
                    #{item.name}
                  </Text>
                  <Pressable
                    onPress={() => confirmDelete(item.name)}
                    hitSlop={8}
                    accessibilityLabel={`Xoá nhãn ${item.name}`}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={colors.destructive}
                    />
                  </Pressable>
                </View>
              )}
            />
          )}
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  emptyCard: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
