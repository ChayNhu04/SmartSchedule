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
import { Stack, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserSummary } from "@smartschedule/shared";
import { Screen } from "../../../components/Screen";
import { Button } from "../../../components/Button";
import { Input } from "../../../components/Input";
import { useTheme } from "../../../theme/ThemeContext";
import { elevation, radius, spacing, typography } from "../../../theme/tokens";
import { api } from "../../../services/api";

function pickError(err: unknown, fallback: string): string {
  const e = err as {
    response?: { data?: { message?: string | string[] } };
    message?: string;
  };
  const msg = e?.response?.data?.message ?? e?.message;
  if (Array.isArray(msg)) return msg[0] || fallback;
  return msg || fallback;
}

export default function ShareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [foundUser, setFoundUser] = useState<UserSummary | null>(null);

  const sharesQuery = useQuery({
    enabled: !!id,
    queryKey: ["schedule-shares", id],
    queryFn: async () =>
      (await api.get<UserSummary[]>(`/schedules/${id}/shares`)).data,
  });

  const lookupMut = useMutation({
    mutationFn: async () => {
      const trimmed = email.trim();
      if (!trimmed) throw new Error("Vui lòng nhập email");
      const { data } = await api.get<UserSummary>(
        `/users/lookup?email=${encodeURIComponent(trimmed)}`,
      );
      return data;
    },
    onSuccess: (u) => setFoundUser(u),
    onError: (err) => {
      setFoundUser(null);
      Alert.alert("Không tìm thấy", pickError(err, "Không tìm thấy người dùng"));
    },
  });

  const shareMut = useMutation({
    mutationFn: async () => {
      if (!foundUser) throw new Error("Chưa tìm người dùng");
      return api.post(`/schedules/${id}/shares`, {
        target_user_id: foundUser.id,
      });
    },
    onSuccess: () => {
      Alert.alert(
        "Đã chia sẻ",
        `Đã chia sẻ với ${foundUser?.display_name || foundUser?.email}`,
      );
      setEmail("");
      setFoundUser(null);
      qc.invalidateQueries({ queryKey: ["schedule-shares", id] });
    },
    onError: (err) =>
      Alert.alert("Lỗi", pickError(err, "Không thể chia sẻ")),
  });

  const unshareMut = useMutation({
    mutationFn: async (targetId: string) =>
      api.delete(`/schedules/${id}/shares/${targetId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedule-shares", id] });
    },
    onError: () => Alert.alert("Lỗi", "Không thể gỡ chia sẻ"),
  });

  const confirmUnshare = (u: UserSummary) => {
    Alert.alert(
      "Gỡ chia sẻ?",
      `${u.display_name || u.email} sẽ không còn xem được lịch này nữa.`,
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Gỡ",
          style: "destructive",
          onPress: () => unshareMut.mutate(u.id),
        },
      ],
    );
  };

  const shares = sharesQuery.data ?? [];
  const alreadyShared = !!(
    foundUser && shares.some((s) => s.id === foundUser.id)
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Chia sẻ",
          headerTintColor: colors.text,
          headerStyle: { backgroundColor: colors.background },
        }}
      />
      <Screen edges={["bottom"]}>
        <View style={{ padding: spacing.lg, gap: spacing.lg, flex: 1 }}>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
              elevation.soft,
            ]}
          >
            <Input
              label="Email người nhận"
              hint="Người nhận phải có tài khoản SmartSchedule."
              placeholder="ten@example.com"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (foundUser) setFoundUser(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              onSubmitEditing={() => {
                if (email.trim()) lookupMut.mutate();
              }}
            />
            <Button
              label="Tìm người dùng"
              variant="secondary"
              onPress={() => lookupMut.mutate()}
              loading={lookupMut.isPending}
              disabled={!email.trim() || lookupMut.isPending}
            />

            {foundUser && (
              <View
                style={[
                  styles.foundRow,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    marginTop: spacing.md,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[typography.bodyStrong, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {foundUser.display_name || foundUser.email}
                  </Text>
                  {foundUser.display_name && (
                    <Text
                      style={[typography.caption, { color: colors.textMuted }]}
                      numberOfLines={1}
                    >
                      {foundUser.email}
                    </Text>
                  )}
                </View>
                <Button
                  label={alreadyShared ? "Đã chia sẻ" : "Chia sẻ"}
                  onPress={() => shareMut.mutate()}
                  loading={shareMut.isPending}
                  disabled={alreadyShared || shareMut.isPending}
                />
              </View>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={[
                typography.captionStrong,
                {
                  color: colors.textMuted,
                  marginBottom: spacing.sm,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                },
              ]}
            >
              Đã chia sẻ với ({shares.length})
            </Text>

            {sharesQuery.isLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : shares.length === 0 ? (
              <View
                style={[
                  styles.emptyCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.body,
                    { color: colors.textMuted, textAlign: "center" },
                  ]}
                >
                  Chưa chia sẻ với ai
                </Text>
              </View>
            ) : (
              <FlatList
                data={shares}
                keyExtractor={(u) => u.id}
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
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          typography.bodyStrong,
                          { color: colors.text },
                        ]}
                        numberOfLines={1}
                      >
                        {item.display_name || item.email}
                      </Text>
                      {item.display_name && (
                        <Text
                          style={[
                            typography.caption,
                            { color: colors.textMuted },
                          ]}
                          numberOfLines={1}
                        >
                          {item.email}
                        </Text>
                      )}
                    </View>
                    <Pressable
                      onPress={() => confirmUnshare(item)}
                      hitSlop={8}
                      accessibilityLabel={`Gỡ chia sẻ với ${item.email}`}
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
  foundRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
});
