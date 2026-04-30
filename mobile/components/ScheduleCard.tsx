import { StyleSheet, Text, View } from "react-native";
import { format } from "date-fns";
import type { Schedule } from "../types/schedule";

const PRIORITY_FLAG: Record<string, string> = {
  low: "🟢",
  normal: "🟡",
  high: "🔴",
};

export function ScheduleCard({ schedule }: { schedule: Schedule }) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.flag}>{PRIORITY_FLAG[schedule.priority] ?? "🟡"}</Text>
        <Text style={styles.title} numberOfLines={1}>
          {schedule.title}
        </Text>
      </View>
      <Text style={styles.time}>
        {format(new Date(schedule.start_time), "HH:mm dd/MM/yyyy")}
        {schedule.end_time ? ` → ${format(new Date(schedule.end_time), "HH:mm")}` : ""}
      </Text>
      {schedule.description ? (
        <Text style={styles.desc} numberOfLines={2}>
          {schedule.description}
        </Text>
      ) : null}
      {schedule.status !== "pending" ? (
        <Text style={styles.status}>{schedule.status}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  row: { flexDirection: "row", alignItems: "center" },
  flag: { fontSize: 16, marginRight: 6 },
  title: { fontSize: 16, fontWeight: "600", flex: 1 },
  time: { color: "#555", marginTop: 4, fontSize: 13 },
  desc: { color: "#888", marginTop: 6, fontSize: 13 },
  status: { color: "#1f6feb", marginTop: 6, fontSize: 12, textTransform: "uppercase" },
});
