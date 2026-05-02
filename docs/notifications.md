# Push Notifications

Tài liệu đầy đủ về push notification trên SmartSchedule. **Đọc kỹ §1 trước khi thử test** — hiện trạng hệ thống chưa hoàn toàn thông suốt.

## 1. Hiện trạng (quan trọng)

| Thành phần | Trạng thái |
|---|---|
| Backend cron `RemindersService` quét `remind_at` mỗi phút | ✓ **Đã có** (`backend/src/reminders/reminders.service.ts`) |
| Backend `PushService` wrap `expo-server-sdk`, batch chunks | ✓ **Đã có** (`backend/src/reminders/push.service.ts`) |
| Endpoint `PATCH /api/users/me/push-token` lưu token vào `users.expo_push_token` | ✓ **Đã có** (`backend/src/users/users.controller.ts:25`) |
| Mobile có hàm `registerForPushNotificationsAsync()` xin permission + lấy Expo Push Token + gọi backend | ✓ **Đã có** (`mobile/services/notifications.ts`) |
| Mobile **gọi** `registerForPushNotificationsAsync()` ở đâu đó trong app lifecycle | ✗ **CHƯA CÓ** — hàm tồn tại nhưng không được import / call ở bất cứ component nào (`grep -rn "registerForPush" mobile` chỉ thấy mỗi file định nghĩa) |

**Kết luận**: dù backend sẵn sàng nhận token và đẩy push, **token chưa bao giờ được upload** từ app — vì hàm register không bao giờ được gọi. Push notification thực tế **chưa hoạt động end-to-end** trên app hiện tại.

→ **Đề xuất bổ sung** (xem §6): gọi `registerForPushNotificationsAsync()` sau khi user đăng nhập thành công, hoặc trong `_layout.tsx` (root) khi store đã có token.

---

## 2. Pipeline thiết kế

```
[1] Mobile app launch (sau login)
        │
        ▼
[2] registerForPushNotificationsAsync()
    - Notifications.getPermissionsAsync()
    - if not granted → requestPermissionsAsync()
    - Notifications.getExpoPushTokenAsync({ projectId })
        │
        ▼
[3] PATCH /api/users/me/push-token { token: "ExponentPushToken[xxxx]" }
        │
        ▼
[4] Backend: UPDATE users SET expo_push_token = $1 WHERE id = $2
        │
   ─────┴──── (chờ đến khi có schedule với remind_at <= now()) ────
        │
        ▼
[5] Cron mỗi phút: RemindersService.tick()
    - SELECT schedules WHERE remind_at <= NOW() AND status='pending' AND acknowledged_at IS NULL
    - foreach: PushService.send([{ to: user.expo_push_token, title, body, data }])
        │
        ▼
[6] Expo Push Service (https://exp.host) → APNS / FCM → device
        │
        ▼
[7] Notifications.setNotificationHandler() trên mobile xử lý hiển thị (banner + sound)
        │
        ▼
[8] User tap notification → navigate đến schedule detail (cần kiểm tra: hiện chưa có handler navigate)
```

## 3. File liên quan

| File | Vai trò |
|---|---|
| `backend/src/reminders/reminders.module.ts` | Khai báo module, bind `RemindersService` + `PushService` |
| `backend/src/reminders/reminders.service.ts` | Cron `@Cron(CronExpression.EVERY_MINUTE)`, query schedule due, đẩy push, cập nhật `remind_at` về tương lai để re-nhắc |
| `backend/src/reminders/push.service.ts` | Wrapper `expo-server-sdk`, validate token, chunk message, log lỗi |
| `backend/src/users/users.controller.ts` | `PATCH /me/push-token` |
| `backend/src/users/users.service.ts` | `update({ id }, { expo_push_token: token })` |
| `mobile/services/notifications.ts` | `registerForPushNotificationsAsync()` + `setNotificationHandler` |
| `backend/src/schedules/entities/schedule.entity.ts` | Cột `remind_at`, `is_reminded`, `acknowledged_at`, `end_notified_at` |
| `backend/migrations/001-init.sql:48-49` | Index `idx_schedules_remind ON schedules(remind_at, is_reminded)` |

## 4. Env vars

| Var | Bắt buộc | Tác dụng |
|---|---|---|
| `EXPO_ACCESS_TOKEN` | optional | Cần nếu muốn nhận **push receipts** từ Expo (xem ack/error sau khi push). Tạo ở https://expo.dev/accounts/<you>/settings/access-tokens. Không có vẫn gửi được, chỉ là không có receipt. |

Mobile không cần env var đặc biệt — Expo Go tự cung cấp `projectId` qua `Constants.expoConfig.extra.eas.projectId` (chỉ tồn tại sau `eas init`).

## 5. Cách test (khi đã wire xong §1)

### 5.1 Test gửi push thẳng từ Expo (bỏ qua backend)
```bash
curl -X POST https://exp.host/--/api/v2/push/send \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "ExponentPushToken[xxxxx]",
    "title": "Test",
    "body": "Hello từ curl"
  }'
```
Token lấy được sau khi gọi `registerForPushNotificationsAsync()` (log ra console mobile, hoặc query DB `SELECT expo_push_token FROM users WHERE id='<your-id>'`).

### 5.2 Test cron backend
1. Đăng nhập mobile → đảm bảo token đã sync sang DB.
2. Tạo lịch với `remind_at` cách hiện tại 1 phút:
   ```bash
   curl -X POST http://localhost:3000/api/schedules \
     -H "Authorization: Bearer $TOKEN" \
     -H 'Content-Type: application/json' \
     -d '{
       "title": "Test push",
       "start_time": "'"$(date -u -d '+5 minutes' +%Y-%m-%dT%H:%M:%S.000Z)"'",
       "remind_at": "'"$(date -u -d '+1 minutes' +%Y-%m-%dT%H:%M:%S.000Z)"'"
     }'
   ```
3. Đợi ≤ 1 phút → đọc log backend (`docker compose logs -f backend`):
   - Phải thấy `[RemindersService] 🔔1 start-reminder(s) cần gửi`.
4. Push xuất hiện trên màn hình điện thoại.

### 5.3 Test trên Expo Web hoặc Simulator
**Không thể**. `expo-notifications` chỉ hoạt động trên thiết bị thật (xem `Device.isDevice` check ở `mobile/services/notifications.ts:18`). Web/simulator → token là `null` → backend không có gì để push.

## 6. Đề xuất bổ sung — wire push vào lifecycle

Trong `mobile/app/_layout.tsx` hoặc tốt hơn `mobile/app/(tabs)/_layout.tsx`:

```tsx
import { useEffect } from "react";
import { useAuthStore } from "../../hooks/useAuthStore";
import { registerForPushNotificationsAsync } from "../../services/notifications";

export default function TabsLayout() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      registerForPushNotificationsAsync().catch(() => {
        // user từ chối permission — bỏ qua, không crash
      });
    }
  }, [user?.id]);

  // ...rest
}
```

Lưu ý: nên gọi **sau khi user login** (có `auth_token` trong AsyncStorage) chứ KHÔNG gọi ngay khi app mount, vì `api.patch(/users/me/push-token)` cần Bearer token.

> Đây là đề xuất, chưa implement trong PR doc này.

## 7. Lỗi thường gặp

| Triệu chứng | Nguyên nhân | Fix |
|---|---|---|
| Mobile log không có Expo Push Token | `registerForPushNotificationsAsync()` chưa được gọi | Wire vào lifecycle (§6) |
| `Device.isDevice === false` → return null | Đang chạy simulator/web | Test trên thiết bị thật |
| Token trả về `null` | User từ chối permission | Vào Settings điện thoại bật notification cho Expo Go / app |
| `Constants.expoConfig.extra.eas.projectId` undefined | Chưa `eas init` | Chạy `eas init` trong `mobile/`, hoặc chấp nhận Expo Go (vẫn lấy được token nhờ `null projectId` fallback) |
| Backend cron im lặng dù schedule có `remind_at` | `acknowledged_at` đã được set, hoặc `status != 'pending'`, hoặc user `expo_push_token IS NULL` | Check DB: `SELECT id, remind_at, acknowledged_at, status FROM schedules WHERE id=...` |
| `Invalid Expo push token` log từ `PushService` | Token client lưu khác format `ExponentPushToken[...]` | Có thể device đang ở mode FCM thuần — đảm bảo dùng `getExpoPushTokenAsync()`, không phải `getDevicePushTokenAsync()` |
| Push nhận được trên thiết bị nhưng không hiện banner | `setNotificationHandler` trả về `shouldShowBanner: false` | Đã set `true` trong code; kiểm Settings điện thoại có chặn không |
| Push gửi xong vẫn chưa unmark `is_reminded` | Cron đẩy `remind_at` về tương lai → user sẽ bị nhắc lại sau `default_remind_minutes`. Đây là **feature** không phải bug | Set `acknowledged_at` từ client khi user tap notification để stop loop |

## 8. Khi production (Railway/Fly/...)

- Đảm bảo `EXPO_ACCESS_TOKEN` được set nếu muốn track receipts.
- Đảm bảo cron service không bị scale-to-zero (Railway/Fly free tier có thể sleep). Nếu sleep → cron không chạy → push trễ. Workaround: ping `/api/docs` định kỳ qua UptimeRobot.
- Khi build EAS production, verify `app.json > expo.extra.eas.projectId` đã có để token trỏ đúng project.

## 9. Tham khảo
- Expo Push Notifications: https://docs.expo.dev/push-notifications/overview/
- expo-server-sdk: https://github.com/expo/expo-server-sdk-node
- NestJS Schedule (cron): https://docs.nestjs.com/techniques/task-scheduling
