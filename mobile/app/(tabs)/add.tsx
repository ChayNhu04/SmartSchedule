import { Alert } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import type { CreateScheduleRequest } from "@smartschedule/shared";
import { Screen } from "../../components/Screen";
import { ScheduleForm } from "../../components/ScheduleForm";
import { api } from "../../services/api";

export default function AddScreen() {
  const qc = useQueryClient();

  const handleSubmit = async (payload: CreateScheduleRequest) => {
    await api.post("/schedules", payload);
    qc.invalidateQueries({ queryKey: ["schedules"] });
    Alert.alert("Đã lưu", "Tạo lịch thành công");
    router.replace("/(tabs)");
  };

  return (
    <Screen title="Thêm lịch" subtitle="Tạo lịch mới cho bạn">
      <ScheduleForm submitLabel="Lưu lịch" onSubmit={handleSubmit} />
    </Screen>
  );
}
