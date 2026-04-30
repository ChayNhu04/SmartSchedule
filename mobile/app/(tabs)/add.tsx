import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { api } from "../../services/api";

export default function AddScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState(""); // ISO string
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
  const qc = useQueryClient();

  const submit = async () => {
    if (!title || !startTime) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tiêu đề và thời gian bắt đầu");
      return;
    }
    try {
      await api.post("/schedules", { title, description, start_time: startTime, priority });
      qc.invalidateQueries({ queryKey: ["schedules"] });
      Alert.alert("Đã lưu", "Tạo lịch thành công");
      router.replace("/(tabs)");
      setTitle("");
      setDescription("");
      setStartTime("");
    } catch (err: any) {
      Alert.alert("Lỗi", err?.response?.data?.message ?? err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.heading}>Thêm lịch mới</Text>
        <TextInput
          style={styles.input}
          placeholder="Tiêu đề *"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Mô tả (tùy chọn)"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <TextInput
          style={styles.input}
          placeholder="Bắt đầu (ISO 8601, vd 2026-05-01T09:00:00+07:00) *"
          value={startTime}
          onChangeText={setStartTime}
          autoCapitalize="none"
        />
        <Text style={styles.label}>Ưu tiên:</Text>
        {(["low", "normal", "high"] as const).map((p) => (
          <Pressable
            key={p}
            style={[styles.priorityRow, priority === p && styles.priorityRowActive]}
            onPress={() => setPriority(p)}
          >
            <Text>
              {p === "low" ? "🟢 Thấp" : p === "normal" ? "🟡 Vừa" : "🔴 Cao"}
            </Text>
          </Pressable>
        ))}
        <Pressable style={styles.button} onPress={submit}>
          <Text style={styles.buttonText}>Lưu lịch</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  heading: { fontSize: 24, fontWeight: "700", marginBottom: 16 },
  label: { marginTop: 8, marginBottom: 4, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  priorityRow: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 8,
  },
  priorityRowActive: { borderColor: "#1f6feb", backgroundColor: "#eef4ff" },
  button: {
    backgroundColor: "#1f6feb",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
