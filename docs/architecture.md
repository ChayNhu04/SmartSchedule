# Kiến trúc SmartSchedule

Tài liệu giải thích cách 4 package tương tác với nhau. Đọc kèm code để dễ hình dung. Tổng quan ngắn gọn — chi tiết module/entity/DTO ở [`../PROJECT.md`](../PROJECT.md).

## 1. Tổng quan 4 package

```
                 ┌──────────────────────────────┐
                 │  shared (TypeScript types)   │
                 │  no runtime, dùng chung 3    │
                 │  client để khớp contract     │
                 └──────────────┬───────────────┘
                                │ import
        ┌───────────────────────┼────────────────────────┐
        │                       │                        │
        ▼                       ▼                        ▼
  ┌──────────┐          ┌──────────────┐          ┌──────────────┐
  │ backend  │◀── REST ─│  web (SSR    │          │  mobile      │
  │ NestJS   │   /api   │  Next.js)    │          │  Expo / RN   │
  └─────┬────┘          └──────────────┘          └──────┬───────┘
        │ TypeORM                                         │ axios + JWT
        ▼                                                 │
  ┌──────────┐                                            │
  │ Postgres │◀──────────── REST /api ────────────────────┘
  └──────────┘
```

### `shared/` — `@smartschedule/shared`
- 2 file chính: [`shared/src/index.ts`](../shared/src/index.ts) (types) và [`shared/src/parse-vi.ts`](../shared/src/parse-vi.ts) (NLP parser).
- Export: enum (`SchedulePriority`, `ScheduleStatus`, `ScheduleItemType`, `RecurrenceType`), labels tiếng Việt, interface (`Schedule`, `Tag`, `AuthUser`, `UserSettings`, `ScheduleTemplate`, …) và contract API (`LoginRequest`, `CreateScheduleRequest`, …).
- `parse-vi.ts` là pure TS (no runtime deps) parse câu tiếng Việt → `{ title, start_time }`. Dùng bởi web + mobile cho tính năng "Thêm nhanh". 26 unit tests.
- Khi đổi schema DB / DTO ở backend, **phải đồng bộ** type ở đây để 2 client compile.

### `backend/` — NestJS REST API
Module map (xem `backend/src/app.module.ts`):

| Module | Path prefix | Trách nhiệm |
|---|---|---|
| `AuthModule` | `/auth/*` | Register, login, `me`. Phát JWT. |
| `UsersModule` | `/users/*` | Get/update settings, update push token, lookup theo email. |
| `SchedulesModule` | `/schedules/*` | CRUD lịch + filter (today / upcoming / overdue / search) + stats + **undo (10 phút, in-memory)** + **export `.ics`**. |
| `TagsModule` | `/tags/*`, `/schedules/:id/tags`, `/schedules-by-tag/:name` | CRUD tag, gán/gỡ tag. |
| `TemplatesModule` | `/templates/*` | CRUD template, instantiate thành schedule. |
| `SharesModule` | `/schedules/:id/shares`, `/shared-with-me` | Chia sẻ lịch giữa user. |
| `RemindersModule` | (cron, không expose REST) | Cron mỗi phút quét `remind_at`, đẩy push qua Expo. Có **work-hours shift** — reminder ngoài khung giờ làm việc dồn về đầu khung kế tiếp. |
| `AuditModule` | `/audit` | Log mọi thay đổi schedule (create/update/complete/cancel/restore/share-add/…). |
| `HealthModule` | `/health` | No-auth ping, kiểm DB connection — dùng cho uptime monitor. |

Global prefix: `app.setGlobalPrefix('api')` ở `backend/src/main.ts`. Tất cả URL có dạng `/api/<module>/...`.

Các kỹ thuật:
- `ConfigModule.forRoot({ isGlobal: true })` — đọc env.
- `TypeOrmModule.forRootAsync(databaseConfig)` — Postgres connection.
- `ScheduleModule.forRoot()` (NestJS Schedule) — cho phép `@Cron` ở `RemindersService`.
- `ThrottlerModule` — rate limit 120 req/phút mặc định.
- `class-validator` qua `ValidationPipe` global — kiểm DTO.

### `web/` — Next.js 15 (App Router)
- Route public: `/login`, `/register` (xem `web/app/login`, `web/app/register`).
- Route protected (group `(app)/`): `today`, `upcoming`, `overdue`, `calendar`, `search`, `tags`, `templates`, `shared`, `stats`, `settings`.
- `web/lib/api.ts`: axios client, interceptor tự gắn `Bearer <token>`, redirect `/login` khi 401.
- TanStack Query (xem `web/app/providers.tsx`) cache server state.
- Tailwind + shadcn/ui (`web/components/ui`), schedule UI ở `web/components/schedule/`.
- Sonner toast cho mọi feedback (success/error). Toast của delete/complete có action button "Hoàn tác" 8s gọi `POST /schedules/undo`.
- ConfirmDialog (shadcn AlertDialog) cho mọi action destructive (xoá) — thay `window.confirm`.

### `mobile/` — Expo / React Native (SDK 54+)
- Routing: Expo Router file-based.
  - `(auth)/login`, `(auth)/register` — màn hình public.
  - `(tabs)/index` (Hôm nay), `(tabs)/upcoming`, `(tabs)/add`, `(tabs)/search`, `(tabs)/settings`.
  - Stack screens gốc: `/schedule/:id` (chi tiết), `/schedule/:id/edit`, `/schedule/:id/share`, `/overdue`, `/shared`, `/tags`, `/templates`, `/stats`.
- `mobile/services/api.ts`: axios client, đọc token từ `AsyncStorage` (`auth_token`), gắn `Authorization` header.
- `mobile/services/notifications.ts`: `registerForPushNotificationsAsync()` xin permission, lấy Expo Push Token, PATCH `/users/me/push-token`. Được gọi từ `(tabs)/_layout.tsx` sau khi `useAuthStore.token` truthy. Xem [`notifications.md`](./notifications.md).
- `mobile/hooks/useAuthStore.ts`: Zustand store giữ `user` + lifecycle login/logout.
- TanStack Query cho data fetching.
- Theme custom (sáng/tối) qua `mobile/theme/ThemeContext.tsx`.
- Form lịch dùng chung component `mobile/components/ScheduleForm.tsx` cho cả tạo + sửa.

---

## 2. Data flow chuẩn (vd: tạo lịch)

```
User gõ form trên mobile / web
              │
              ▼
[Client] validate input (date format, title required, ...)
              │
              ▼
[Client] axios POST /api/schedules
   Authorization: Bearer <jwt>
   Body: CreateScheduleRequest (shared/src/index.ts:134)
              │ HTTPS
              ▼
[Backend] AuthGuard('jwt') → decode JWT → req.user = { id, email }
              │
              ▼
[Backend] ValidationPipe: kiểm DTO match class-validator
              │
              ▼
[Backend] SchedulesController.create() → SchedulesService.create()
              │
              ▼
[Backend] TypeORM INSERT INTO schedules ...
              │
              ▼
[Backend] AuditService.log('create', schedule_id, user_id, changes)
              │
              ▼
[Backend] return Schedule object (JSON)
              │
              ▼
[Client] TanStack Query invalidate ["schedules", "today"], ["schedules", "upcoming"]
              │
              ▼
[Client] màn hình tự refetch + render danh sách mới
```

## 3. Auth flow (JWT)

```
Đăng ký:
  POST /api/auth/register { email, password, display_name? }
    → AuthService.register
        → bcrypt.hash(password)
        → INSERT users
        → INSERT user_settings (default values)
        → JwtService.sign({ sub: user.id, email })
    ← { access_token, user }

Đăng nhập:
  POST /api/auth/login { email, password }
    → AuthService.login
        → SELECT users WHERE email
        → bcrypt.compare
        → JwtService.sign(...)
    ← { access_token, user }

Mọi request sau:
  Header: Authorization: Bearer <jwt>
    → AuthGuard('jwt') in passport-jwt
        → JwtStrategy.validate({ sub, email })
        → req.user = { id: sub, email }
```

JWT secret đọc từ `JWT_SECRET` env var (xem `backend/src/auth/jwt.strategy.ts`). Đổi secret = invalidate tất cả token cũ.

Client lưu token:
- **Web**: `localStorage.auth_token`. Đọc trong axios interceptor.
- **Mobile**: `AsyncStorage.auth_token`. Đọc trong axios interceptor.
- Khi 401 → client tự xoá token và đẩy về `/login`.

## 4. Schedule lifecycle

```
                  ┌──────────────┐
                  │   pending    │ ← state mặc định khi vừa tạo
                  └──────┬───────┘
                         │
            ┌────────────┼────────────┐
            ▼            ▼            ▼
   complete (button)  cancel (PATCH)  delete (soft? hard?)
            │            │            │
            ▼            ▼            ▼
      completed     cancelled    (gone)

Audit log ghi từng transition vào bảng schedule_audit_logs.
```

**Undo (10 phút)**: cả `complete()` và `remove()` push 1 snapshot vào `UndoStore` (in-memory, per-user, max 20 entry, TTL 10 phút) trước khi mutate. `POST /schedules/undo` pop entry gần nhất → re-create cho `delete` hoặc revert `status`/`acknowledged_at` cho `complete`. Cả hai chiều log audit action `restore`. `UndoCleanupService` chạy `@Cron(EVERY_MINUTE)` sweep entry hết hạn. Restart backend → mất state undo (MVP trade-off, không persist).

Cột chính trong bảng `schedules` (xem `backend/migrations/001-init.sql:26-46`):
- `status` ∈ {pending, completed, cancelled}
- `priority` ∈ {low, normal, high}
- `item_type` ∈ {task, meeting, event, reminder}
- `start_time`, `end_time`, `remind_at` — TIMESTAMPTZ.
- `recurrence_type` ∈ {none, daily, weekly, monthly}, `recurrence_interval`, `recurrence_until`, `recurrence_parent_id`.
  - Lưu ý: hiện tại lich lặp chỉ lưu **1 row gốc** (không sinh occurrences sang nhiều row). Logic render occurrences ở client (calendar view). Nếu cần materialize → bổ sung sau.

## 5. Reminder flow (cron)

```
Mỗi phút (CronExpression.EVERY_MINUTE):
  RemindersService.tick():
    ├── processStart():
    │     SELECT schedules WHERE remind_at <= NOW()
    │       AND acknowledged_at IS NULL
    │       AND status = 'pending'
    │       AND user.notify_via_push = true       ← respect settings toggle
    │     ORDER BY remind_at ASC LIMIT 100
    │
    │     for each due schedule:
    │       if outside user.work_hours:           ← work-hours shift
    │         remind_at = nextWorkHourStart(user.timezone)
    │         continue
    │       if user.expo_push_token tồn tại:
    │         PushService.send([{ to: token, title, body, data }])
    │       UPDATE schedules SET
    │         remind_at = NOW() + default_remind_minutes,
    │         is_reminded = TRUE
    │
    └── processEnd():
          tương tự nhưng quét end_time, đặt end_notified_at = NOW().
```

Push thực tế đi qua Expo Push Service (`expo-server-sdk`). Chi tiết + cách test ở [`notifications.md`](./notifications.md).

## 6. REST API tham khảo nhanh

| Endpoint | Method | Auth | Mô tả |
|---|---|:---:|---|
| `/api/health` | GET | — | Health check (DB ping, uptime, timestamp) — cho uptime monitor |
| `/api/auth/register` | POST | — | Tạo user + trả JWT |
| `/api/auth/login` | POST | — | Login, trả JWT |
| `/api/auth/me` | GET | ✓ | Thông tin user hiện tại |
| `/api/users/me/settings` | GET | ✓ | UserSettings |
| `/api/users/me/settings` | PATCH | ✓ | Update settings |
| `/api/users/me/push-token` | PATCH | ✓ | Đăng ký Expo Push Token |
| `/api/users/lookup?email=` | GET | ✓ | Tìm user theo email (cho UI chia sẻ) |
| `/api/schedules` | POST | ✓ | Tạo lịch |
| `/api/schedules` | GET | ✓ | List lịch (tất cả) |
| `/api/schedules/today` | GET | ✓ | Lịch hôm nay |
| `/api/schedules/upcoming` | GET | ✓ | Lịch sắp tới |
| `/api/schedules/overdue` | GET | ✓ | Lịch quá hạn |
| `/api/schedules/search?q=…` | GET | ✓ | Tìm theo keyword |
| `/api/schedules/stats` | GET | ✓ | Số liệu (count, completion rate, byPriority, byType) |
| `/api/schedules/:id` | GET / PATCH / DELETE | ✓ | CRUD chi tiết |
| `/api/schedules/:id/complete` | POST | ✓ | Đánh dấu hoàn thành |
| `/api/schedules/undo/peek` | GET | ✓ | Xem thao tác có thể hoàn tác (10 phút) |
| `/api/schedules/undo` | POST | ✓ | Hoàn tác xoá / hoàn-thành gần nhất |
| `/api/schedules/export.ics` | GET | ✓ | Xuất iCalendar |
| `/api/tags` | GET / POST | ✓ | List, tạo tag |
| `/api/tags/:name` | DELETE | ✓ | Xoá tag |
| `/api/schedules/:id/tags` | POST | ✓ | Gán tag vào lịch |
| `/api/schedules/:id/tags/:name` | DELETE | ✓ | Gỡ tag |
| `/api/schedules-by-tag/:name` | GET | ✓ | Lọc lịch theo tag |
| `/api/templates` | GET / POST | ✓ | List, tạo template |
| `/api/templates/:name` | DELETE | ✓ | Xoá |
| `/api/templates/:name/instantiate` | POST | ✓ | Sinh lịch từ template |
| `/api/schedules/:id/shares` | POST / GET | ✓ | Thêm / list share |
| `/api/schedules/:id/shares/:targetId` | DELETE | ✓ | Gỡ share |
| `/api/shared-with-me` | GET | ✓ | Lịch người khác chia sẻ cho mình |
| `/api/audit` | GET | ✓ | Audit log |
| `/api/docs` | — | — | Swagger UI |

> Swagger có sẵn — chạy backend xong vào `http://localhost:3000/api/docs` xem schema chính xác.

## 7. Đề xuất cải tiến kiến trúc

Các điểm có thể cải thiện (chưa làm, để cân nhắc):

- **Migrations runtime**: chuyển từ "1 file SQL chạy 1 lần khi init" sang TypeORM migrations (`pnpm typeorm migration:generate`) để versioning rõ ràng.
- **Refresh token**: hiện chỉ có access token 7d, hết hạn user phải login lại. Có thể thêm refresh token + rotation.
- **Realtime**: chưa có WebSocket / SSE — share lịch hoặc thay đổi không đẩy realtime cho client thứ hai.
- **Reminder retry / dead-letter**: cron chỉ best-effort, không retry khi Expo trả lỗi (xem `backend/src/reminders/push.service.ts`).
- **Undo persistence**: hiện in-memory — backend restart mất state. Có thể chuyển sang Redis hoặc bảng `schedule_undo_entries` với TTL job.
- **Recurrence materialization**: hiện lưu 1 row gốc, client tự sinh occurrences — có thể thêm job materialize vào DB để query nhanh hơn.
- **ICS import** (chiều ngược của `export.ics`): backend đã cài `ical.js` nhưng chưa code endpoint.
- **Mobile parity**: thêm UI tag / template / share / overdue / calendar (xem [`user-guide.md` §9](./user-guide.md#9-tính-năng-có-sẵn--bảng-đối-chiếu)).
