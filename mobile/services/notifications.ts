import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { api } from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Yêu cầu quyền + lấy Expo push token, sau đó upload lên backend
 * (`PATCH /users/me/push-token`). An toàn để gọi nhiều lần — backend chỉ
 * upsert. Trả về token string nếu thành công, hoặc null nếu:
 *   - đang chạy trên simulator/web (Expo không cấp token);
 *   - user từ chối permission;
 *   - lỗi khi lấy token (ví dụ chưa cấu hình EAS projectId trong dev build).
 *
 * KHÔNG throw ra ngoài — caller có thể fire-and-forget.
 */
export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  if (!Device.isDevice) {
    if (__DEV__) {
      console.log("[push] skipped: simulator/web không nhận push token");
    }
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    if (__DEV__) {
      console.log("[push] permission denied — không đăng ký token");
    }
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  let token: string;
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    token = tokenData.data;
  } catch (err) {
    if (__DEV__) {
      console.warn("[push] getExpoPushTokenAsync failed", err);
    }
    return null;
  }

  try {
    await api.patch("/users/me/push-token", { token });
    if (__DEV__) {
      console.log("[push] đã đăng ký token với backend");
    }
  } catch (err) {
    if (__DEV__) {
      console.warn("[push] backend register failed", err);
    }
  }
  return token;
}
