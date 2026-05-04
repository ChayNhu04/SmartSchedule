import { Alert } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import type { CreateScheduleRequest } from "@smartschedule/shared";
import { Screen } from "../../components/Screen";
import { ScheduleForm } from "../../components/ScheduleForm";
import { api } from "../../services/api";
import { bucketForStartTime } from "../../lib/schedule-bucket";

export default function AddScreen() {
  const qc = useQueryClient();

  const handleSubmit = async (payload: CreateScheduleRequest) => {
    await api.post("/schedules", payload);
    qc.invalidateQueries({ queryKey: ["schedules"] });

    const bucket = bucketForStartTime(payload.start_time);
    router.replace(bucket.tabPath as never);

    if (bucket.key === "overdue") {
      Alert.alert(
        "Đã tạo lịch",
        "Lịch này đang quá hạn (mốc bắt đầu nằm trước thời điểm hiện tại). " +
          "Bạn có thể tìm thấy nó ở tab Hôm nay (nếu cùng ngày) hoặc dùng tab Tìm.",
      );
    }
  };

  return (
    <Screen title="Thêm lịch" subtitle="Tạo lịch mới cho bạn">
      <ScheduleForm submitLabel="Lưu lịch" onSubmit={handleSubmit} />
    </Screen>
  );
}
