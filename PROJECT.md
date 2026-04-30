# SmartSchedule — Tài liệu dự án

> Mọi thứ về dự án: kiến trúc, tech stack, data model, API, mobile, deploy, roadmap.
> Tham khảo nhanh: [README.md](./README.md) — quickstart và lệnh thường dùng.

---

## 1. Mục tiêu

SmartSchedule là **app quản lý lịch trình & nhắc nhở thông minh**, lấy cảm hứng từ
[BotThoiGianBieu](https://github.com/dinhvien04/BotThoiGianBieu) (Mezon bot)
nhưng được tái cấu trúc thành:

- **Backend NestJS** expose REST API thuần (không Mezon, không Discord).
- **Mobile React Native (Expo)** làm giao diện chính.
- **Push notification** thay cho channel message của bot — gửi qua Expo Push.

Đối tượng người dùng: cá nhân muốn quản lý task / meeting / event với reminder
chủ động, hỗ trợ priority, tag, recurrence, share, template.

---

## 2. Tech stack

| Layer            | Công nghệ                                                            |
|------------------|---------------------------------------------------------------------|
| Backend          | NestJS 10 · TypeORM 0.3 · PostgreSQL 16 · TypeScript 5.7             |
| Auth             | JWT (access token) · bcryptjs · Passport JWT strategy                |
| Background jobs  | `@nestjs/schedule` (cron mỗi phút)                                  |
| Push             | `expo-server-sdk` (Expo Push API)                                    |
| Validation       | `class-validator` + `class-transformer`                             |
| Docs             | `@nestjs/swagger` (OpenAPI tại `/api/docs`)                         |
| Security         | Helmet, CORS, Throttler                                              |
| Excel/iCal       | `xlsx`, `ical.js`                                                   |
| Mobile           | Expo SDK 52 · React Native 0.76 · Expo Router 4 · TypeScript         |
| State            | Zustand (auth) · TanStack Query (server state)                       |
| Storage          | AsyncStorage (token persistence)                                     |
| Notifications    | `expo-notifications` + Expo Push                                     |
| Container        | Multi-stage Dockerfile (Node 20-alpine), docker-compose              |
| CI               | GitHub Actions (lint + build + test, typecheck mobile)              |

---

## 3. Cấu trúc thư mục (monorepo)

```
SmartSchedule/
├── backend/
│   ├── src/
│   │   ├── main.ts                # bootstrap, helmet, CORS, swagger, validation
│   │   ├── app.module.ts          # composition root
│   │   ├── config/
│   │   │   └── database.config.ts
│   │   ├── auth/                  # register / login / JWT / @CurrentUser
│   │   ├── users/                 # me/settings, push-token
│   │   ├── schedules/             # CRUD + queries (today/upcoming/overdue/search/stats)
│   │   ├── tags/                  # tag CRUD + attach/detach
│   │   ├── templates/             # template CRUD + instantiate
│   │   ├── shares/                # share/unshare lịch
│   │   ├── reminders/             # cron + push.service
│   │   └── audit/                 # audit log + history endpoint
│   ├── migrations/                # SQL idempotent
│   ├── Dockerfile
│   ├── tsconfig.json / .build.json / nest-cli.json
│   └── package.json
├── mobile/
│   ├── app/                       # Expo Router (file-based)
│   │   ├── _layout.tsx            # QueryClient + GestureHandler + SafeArea
│   │   ├── index.tsx              # gateway → /(auth) hoặc /(tabs)
│   │   ├── (auth)/                # login / register
│   │   └── (tabs)/                # today / upcoming / add / search / settings
│   ├── components/                # ScheduleCard, …
│   ├── services/                  # api.ts (axios), notifications.ts (Expo Push)
│   ├── hooks/                     # useAuthStore (Zustand)
│   ├── types/                     # Schedule, Priority, …
│   ├── app.json                   # Expo config
│   ├── babel.config.js
│   └── package.json
├── docker-compose.yml             # postgres + backend
├── .github/workflows/ci.yml       # lint + build + test + typecheck
├── .env.example
├── README.md
├── PROJECT.md                     # ⟵ tài liệu này
└── LICENSE
```

---

## 4. Backend — kiến trúc

### 4.1 Composition root

`AppModule` import:

- `ConfigModule` global — đọc `.env`.
- `TypeOrmModule.forRootAsync` — connection PostgreSQL từ `DATABASE_URL`.
- `NestScheduleModule.forRoot()` — cron framework.
- `ThrottlerModule` — 120 req / 60s mặc định.
- 8 feature module: `Auth`, `Users`, `Schedules`, `Tags`, `Templates`, `Shares`, `Reminders`, `Audit`.

`main.ts` áp dụng:

- `helmet()` HTTP security headers.
- `enableCors({ origin: process.env.CORS_ORIGIN, credentials: true })`.
- `setGlobalPrefix("api")` → toàn bộ endpoint nằm dưới `/api/...`.
- `ValidationPipe({ whitelist, transform, forbidNonWhitelisted })`.
- Swagger UI tại `/api/docs` (Bearer Auth).

### 4.2 Auth flow

1. **Register** `POST /api/auth/register` → tạo `User` + `UserSettings` mặc định, trả `{ access_token, user }`.
2. **Login** `POST /api/auth/login` → so sánh bcrypt, trả JWT.
3. **Me** `GET /api/auth/me` (Bearer) → trả profile + settings.
4. JWT payload: `{ sub: userId, email }`. Strategy verify bằng `JWT_SECRET`.
5. `@CurrentUser()` decorator inject `{ id, email }` từ `req.user`.

### 4.3 Module chính

#### SchedulesModule
- `POST /api/schedules` — tạo lịch (`title`, `start_time`, `priority`, `recurrence_*`, …).
- `GET /api/schedules` — list theo filter `status`, `priority`, `from`, `to`, paginate.
- `GET /api/schedules/today` — lịch hôm nay.
- `GET /api/schedules/upcoming?limit=N` — N lịch sắp tới gần nhất.
- `GET /api/schedules/overdue` — lịch quá hạn.
- `GET /api/schedules/search?q=keyword` — search title/description (ILIKE).
- `GET /api/schedules/stats?range=tuan|thang|nam` — statistics breakdown.
- `GET /api/schedules/:id` — chi tiết.
- `PATCH /api/schedules/:id` — cập nhật.
- `POST /api/schedules/:id/complete` — đánh dấu hoàn thành.
- `DELETE /api/schedules/:id` — xoá.

#### TagsModule
- `GET /api/tags`, `POST /api/tags`, `DELETE /api/tags/:name`.
- `POST /api/schedules/:id/tags` body `{ names: ["work", "urgent"] }` — attach (auto-create tag chưa có).
- `DELETE /api/schedules/:id/tags/:name` — detach.
- `GET /api/schedules-by-tag/:name` — list lịch theo tag.

Tag name normalize lowercase, regex `^[a-z0-9_-]+$`, max 30 ký tự.

#### TemplatesModule
- `GET /api/templates`, `POST /api/templates`, `DELETE /api/templates/:name`.
- `POST /api/templates/:name/instantiate` body `{ start_time }` — clone thành Schedule mới, tự tính `end_time` từ `duration_minutes`, `remind_at` từ `default_remind_minutes`.

#### SharesModule
- `POST /api/schedules/:id/shares` body `{ target_user_id }` — share view-only.
- `DELETE /api/schedules/:id/shares/:targetId`.
- `GET /api/schedules/:id/shares` — list participants.
- `GET /api/shared-with-me` — lịch người khác share cho mình.

Owner = `schedules.user_id`. Junction `schedule_shares(schedule_id, shared_with_user_id)`.

#### RemindersModule (cron)
- `@Cron(CronExpression.EVERY_MINUTE)` chạy `tick()`.
- **Start reminder**: tìm lịch có `remind_at <= now`, `acknowledged_at IS NULL`, `status = pending`.
  - Gửi Expo Push tới `user.expo_push_token`.
  - Đẩy `remind_at` về `now + default_remind_minutes` → cron tự nhắc lại nếu user ignore.
- **End notification**: tìm lịch có `end_time <= now` và `end_notified_at IS NULL`, gửi push 1 lần, đánh dấu `end_notified_at`.
- Guard `running` flag tránh reentrancy khi tick chậm.

#### AuditModule
- `AuditService.log(scheduleId, userId, action, changes?)` — append-only.
- `GET /api/schedules/:id/history` — list log có paginate.
- Action: `create | update | complete | cancel | delete | restore | share-add | share-remove | tag-add | tag-remove`.

### 4.4 Validation & errors

- `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` — drop field lạ, reject nếu có field không decorator.
- DTO dùng `class-validator` (`@IsEmail`, `@IsString`, `@IsDateString`, `@IsIn`, …).
- Lỗi business → throw `BadRequestException`, `NotFoundException`, `UnauthorizedException`, `ConflictException`.
- Tự động trả JSON `{ statusCode, message, error }` theo NestJS default exception filter.

### 4.5 Logging & observability

- `Logger` của NestJS với context per-class.
- Mọi lỗi runtime trong cron / route đều log `error` + stack.
- Health check (đề xuất bổ sung): `GET /api/health` qua `@nestjs/terminus`.

---

## 5. Data model (PostgreSQL)

### 5.1 Bảng

```text
users
  id              uuid PK            -- uuid_generate_v4()
  email           varchar(150) UQ
  password_hash   varchar(255)
  display_name    varchar(100)?
  expo_push_token varchar(255)?
  created_at, updated_at

user_settings
  user_id                uuid PK FK→users.id (CASCADE)
  timezone               varchar(50) default 'Asia/Ho_Chi_Minh'
  default_remind_minutes integer default 30
  notify_via_push        bool default true
  work_start_hour        integer default 0
  work_end_hour          integer default 0

schedules
  id                  serial PK
  user_id             uuid FK→users.id (CASCADE)
  item_type           varchar(20) — task|meeting|event|reminder
  title               varchar(255)
  description         text?
  start_time          timestamptz
  end_time            timestamptz?
  status              varchar(20) — pending|completed|cancelled
  priority            varchar(20) — low|normal|high
  remind_at           timestamptz?
  is_reminded         bool
  acknowledged_at     timestamptz?
  end_notified_at     timestamptz?
  recurrence_type     varchar(20) — none|daily|weekly|monthly
  recurrence_interval integer default 1
  recurrence_until    timestamptz?
  recurrence_parent_id integer?      -- ID của lịch gốc trong series
  INDEX (user_id, start_time)
  INDEX (remind_at, is_reminded)

tags
  id      serial PK
  user_id uuid FK→users
  name    varchar(50)             -- lowercase, [a-z0-9_-]
  color   varchar(20)?
  UQ (user_id, name)

schedule_tags
  schedule_id integer FK→schedules (CASCADE)
  tag_id      integer FK→tags (CASCADE)
  PK (schedule_id, tag_id)

schedule_shares
  schedule_id         integer FK→schedules (CASCADE)
  shared_with_user_id uuid    FK→users (CASCADE)
  PK (schedule_id, shared_with_user_id)

schedule_templates
  id                     serial PK
  user_id                uuid FK→users
  name                   varchar(50) UQ với user_id
  item_type              varchar(20)
  title                  varchar(255)
  description            text?
  duration_minutes       integer?
  default_remind_minutes integer?
  priority               varchar(20)

schedule_audit_logs
  id          bigserial PK
  schedule_id integer
  user_id     uuid
  action      varchar(30)
  changes     jsonb?     -- { field: { from, to } }
  INDEX (schedule_id, created_at)
```

### 5.2 Migrations

- File `backend/migrations/001-init.sql` tạo toàn bộ schema (idempotent: dùng `IF NOT EXISTS`).
- Khi chạy `docker compose up`, file được mount vào `/docker-entrypoint-initdb.d` của Postgres → tự exec lúc init container DB.
- Local: `psql "$DATABASE_URL" -f backend/migrations/001-init.sql`.

---

## 6. REST API reference

> Toàn bộ endpoint dưới prefix `/api`. Bearer JWT bắt buộc trừ `/api/auth/register` và `/api/auth/login`.

### Auth
| Method | Endpoint              | Body                                       | Trả về                          |
|--------|-----------------------|--------------------------------------------|---------------------------------|
| POST   | `/api/auth/register`  | `{ email, password, display_name? }`       | `{ access_token, user }`        |
| POST   | `/api/auth/login`     | `{ email, password }`                      | `{ access_token, user }`        |
| GET    | `/api/auth/me`        | —                                          | User profile + settings         |

### Users
| Method | Endpoint                 | Body                                                | Trả về             |
|--------|--------------------------|-----------------------------------------------------|--------------------|
| GET    | `/api/users/me/settings` | —                                                   | UserSettings       |
| PATCH  | `/api/users/me/settings` | partial UpdateSettingsDto                           | UserSettings       |
| PATCH  | `/api/users/me/push-token` | `{ token: ExponentPushToken[…] }`                 | `{ ok: true }`     |

### Schedules
| Method | Endpoint                            | Mô tả                                                                                                            |
|--------|-------------------------------------|------------------------------------------------------------------------------------------------------------------|
| POST   | `/api/schedules`                    | Tạo lịch                                                                                                         |
| GET    | `/api/schedules?status=&priority=&from=&to=&limit=&offset=` | List có filter + paginate                                                              |
| GET    | `/api/schedules/today`              | Lịch hôm nay (start ∈ [00:00, 23:59:59])                                                                         |
| GET    | `/api/schedules/upcoming?limit=N`   | N lịch pending sắp tới                                                                                          |
| GET    | `/api/schedules/overdue`            | Pending + start < now                                                                                            |
| GET    | `/api/schedules/search?q=keyword`   | ILIKE title/description                                                                                          |
| GET    | `/api/schedules/stats?range=tuan\|thang\|nam` | Total, completionRate, byPriority, byType                                                              |
| GET    | `/api/schedules/:id`                | Detail (kèm tags)                                                                                                |
| PATCH  | `/api/schedules/:id`                | Update partial                                                                                                   |
| POST   | `/api/schedules/:id/complete`       | Đánh dấu completed + acknowledged_at = now                                                                       |
| DELETE | `/api/schedules/:id`                | Xoá hẳn                                                                                                          |
| GET    | `/api/schedules/:id/history`        | Audit log paginate                                                                                               |

### Tags
| Method | Endpoint                                  | Body / Mô tả                            |
|--------|-------------------------------------------|-----------------------------------------|
| GET    | `/api/tags`                               | List tag của user                       |
| POST   | `/api/tags`                               | `{ name, color? }` — auto-normalize     |
| DELETE | `/api/tags/:name`                         | Xoá tag (gỡ khỏi mọi lịch)              |
| POST   | `/api/schedules/:id/tags`                 | `{ names: ["work", "urgent"] }`         |
| DELETE | `/api/schedules/:id/tags/:name`           | Detach 1 tag                            |
| GET    | `/api/schedules-by-tag/:name`             | List lịch có tag này                    |

### Templates
| Method | Endpoint                              | Body                                                      |
|--------|---------------------------------------|-----------------------------------------------------------|
| GET    | `/api/templates`                      | —                                                         |
| POST   | `/api/templates`                      | `{ name, title, description?, duration_minutes?, … }`     |
| DELETE | `/api/templates/:name`                | —                                                         |
| POST   | `/api/templates/:name/instantiate`    | `{ start_time }` — trả Schedule mới tạo                   |

### Shares
| Method | Endpoint                                  | Body                          |
|--------|-------------------------------------------|-------------------------------|
| POST   | `/api/schedules/:id/shares`               | `{ target_user_id }`          |
| DELETE | `/api/schedules/:id/shares/:targetId`     | —                             |
| GET    | `/api/schedules/:id/shares`               | List user được share          |
| GET    | `/api/shared-with-me`                     | Lịch được người khác share    |

### Swagger

- UI: `http://localhost:3000/api/docs`
- Toàn bộ controller dùng `@ApiTags`, `@ApiBearerAuth` — auto sinh OpenAPI spec.

---

## 7. Mobile app (Expo)

### 7.1 Routing (Expo Router file-based)

```
app/
├── _layout.tsx           # Root: QueryClientProvider, GestureHandler, SafeArea, Stack
├── index.tsx             # Gateway: hydrate auth → redirect /(auth)/login hoặc /(tabs)
├── (auth)/
│   ├── _layout.tsx
│   ├── login.tsx
│   └── register.tsx
└── (tabs)/
    ├── _layout.tsx        # Bottom tabs
    ├── index.tsx          # Hôm nay
    ├── upcoming.tsx       # Sắp tới
    ├── add.tsx            # Thêm lịch
    ├── search.tsx         # Tìm kiếm
    └── settings.tsx       # Cài đặt + Đăng xuất
```

### 7.2 State

- **Auth**: Zustand store `useAuthStore` lưu `{ token, user }` + persist vào `AsyncStorage` (`auth_token`, `auth_user`). Có `hydrate()`, `setAuth()`, `logout()`.
- **Server state**: TanStack Query (`useQuery` cho list, `useMutation` cho create/update). Stale time 30s.

### 7.3 API client

`services/api.ts`:

```ts
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const baseURL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api";
export const api = axios.create({ baseURL, timeout: 15_000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("auth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

> ⚠️ Khi test trên thiết bị thật, dùng IP LAN của máy backend (vd `http://192.168.1.10:3000/api`) thay vì `localhost`.

### 7.4 Push notifications

`services/notifications.ts`:

1. Request quyền (`Notifications.requestPermissionsAsync`).
2. Tạo Android channel (importance MAX).
3. `getExpoPushTokenAsync({ projectId })` → token dạng `ExponentPushToken[xxxx]`.
4. POST lên `/api/users/me/push-token` để backend lưu vào `users.expo_push_token`.

Backend dùng token này khi cron `RemindersService.tick()` chạy.

### 7.5 Màn hình hiện có (skeleton)

- **Today**: lịch hôm nay (FlatList + RefreshControl).
- **Upcoming**: 20 lịch sắp tới gần nhất.
- **Add**: form tạo lịch nhanh (title, description, start_time ISO, priority).
- **Search**: input + query lazy.
- **Settings**: hiển thị email + nút Đăng xuất.

> Đây là **MVP**. Roadmap UI: detail screen, edit form, recurrence picker, tag chips, share modal, calendar view, stats charts, …

---

## 8. Deploy

### 8.1 Local với docker-compose

```bash
cp .env.example .env
docker compose up -d --build
docker compose logs -f backend
```

- Postgres 16 chạy ở `db:5432`, healthcheck đảm bảo backend không start trước khi DB ready.
- File `backend/migrations/*.sql` tự exec khi container Postgres init lần đầu.
- API: `http://localhost:3000/api` · Swagger: `http://localhost:3000/api/docs`.

### 8.2 Production (VPS / Render / Railway)

1. Build image:
   ```bash
   docker build -t smartschedule-backend ./backend
   ```
2. Push lên registry (Docker Hub / GHCR):
   ```bash
   docker tag smartschedule-backend ghcr.io/chaynhu04/smartschedule-backend:latest
   docker push ghcr.io/chaynhu04/smartschedule-backend:latest
   ```
3. Trên server, set env vars:
   - `DATABASE_URL` (Neon, Supabase, AWS RDS, …)
   - `DATABASE_SSL=true` nếu provider yêu cầu SSL
   - `JWT_SECRET` (random ≥32 ký tự)
   - `EXPO_ACCESS_TOKEN` (optional, dùng nếu cần Expo Push receipts)
   - `CORS_ORIGIN` (comma-separated nếu nhiều)
4. Chạy migrations 1 lần đầu:
   ```bash
   psql "$DATABASE_URL" -f backend/migrations/001-init.sql
   ```
5. `docker run -d --restart=unless-stopped --env-file .env -p 3000:3000 smartschedule-backend`.

> Nginx phía trước → terminate TLS với Let's Encrypt → proxy `localhost:3000`.

### 8.3 Mobile build

```bash
cd mobile
npm install
npx expo install        # đảm bảo SDK match
eas login
eas build:configure
eas build -p android --profile preview   # APK demo
eas build -p android --profile production
eas build -p ios --profile production
```

Để Expo Push hoạt động trong production: cần `expo.extra.eas.projectId` trong `app.json` (`eas init` sẽ tự thêm).

### 8.4 CI

`.github/workflows/ci.yml`:

- Job **backend**: `npm ci → npm run lint → npm run build → npm test` (working dir `./backend`).
- Job **mobile**: `npm install → npm run typecheck` (working dir `./mobile`).

CI chạy trên mọi PR và push vào `main`.

---

## 9. Testing strategy

### Backend (Jest + Supertest)

Mẫu file đề xuất (chưa scaffold, nhưng nên thêm sớm):

- `src/auth/auth.service.spec.ts` — register conflict, login wrong password, token sign.
- `src/schedules/schedules.service.spec.ts` — create, today range, upcoming, overdue, complete idempotent.
- `src/reminders/reminders.service.spec.ts` — mock Schedule repo + PushService, verify tick gửi đúng lịch + đẩy remind_at.
- E2E: `test/jest-e2e.json` + supertest test full register → create schedule → list → complete.

### Mobile

- Unit test components (Jest + `@testing-library/react-native`).
- Detox / Maestro cho E2E (sau).

---

## 10. Roadmap

### v0.1 (MVP — đã scaffold)
- [x] Auth (register/login/JWT)
- [x] Schedule CRUD + today/upcoming/overdue/search/stats
- [x] Tags
- [x] Templates
- [x] Shares
- [x] Reminder cron + Expo Push
- [x] Audit log
- [x] Mobile: 5 tab + login/register

### v0.2 (gần)
- [ ] Mobile: detail screen + edit form
- [ ] Mobile: recurrence picker (UI chọn daily/weekly/monthly + interval + until)
- [ ] Mobile: tag chips trong schedule card + filter theo tag
- [ ] Mobile: stats charts (Victory Native hoặc react-native-svg)
- [ ] Backend: import Excel (`xlsx` đã cài) + import/export `.ics` (`ical.js`)
- [ ] Backend: undo service (xoá / hoàn-thành) trong 10 phút (in-memory)
- [ ] Backend: working hours — reminder ngoài khung dồn về sáng hôm sau
- [ ] Health check `/api/health`
- [ ] Unit + e2e test cover ≥80%

### v0.3 (xa)
- [ ] Quick add tiếng Việt (NLP datetime parser như BotThoiGianBieu)
- [ ] Calendar month view (mobile)
- [ ] Đa người trong cùng lịch (collaborative edit)
- [ ] Web app (Next.js share React Query types)
- [ ] Mention / push tới participants khi share

---

## 11. Quy ước phát triển

### Branch & PR
- Nhánh chính: `main` (protected, CI pass mới merge).
- Feature branch: `feat/<short-name>` hoặc `fix/<short-name>`.
- PR phải pass CI + có description rõ ràng.

### Commit message
Conventional Commits: `feat: ...`, `fix: ...`, `chore: ...`, `docs: ...`, `refactor: ...`, `test: ...`.

### Code style
- Prettier + ESLint cho cả backend và mobile.
- Không dùng `any` trừ khi thật sự cần (warn).
- Backend: tôn trọng Nest module boundary — không inject service ngoài module nếu chưa export.
- Mobile: dùng absolute import `@/components/...` khi project lớn dần.

### Khi thêm feature mới
1. **Backend**: tạo `feature.module.ts` + entity + service + controller + DTO + spec.
2. **Migration**: thêm file `migrations/00X-feature.sql` (idempotent).
3. **Mobile**: thêm screen trong `app/`, types trong `types/`, query keys trong `services/`.
4. **Docs**: update endpoint trong `PROJECT.md` mục API reference.
5. **Test**: thêm unit + e2e cho luồng chính.

---

## 12. Tham chiếu

- Repo gốc lấy cảm hứng: https://github.com/dinhvien04/BotThoiGianBieu
- NestJS docs: https://docs.nestjs.com
- TypeORM docs: https://typeorm.io
- Expo Router: https://docs.expo.dev/router/introduction/
- Expo Push: https://docs.expo.dev/push-notifications/overview/
- TanStack Query: https://tanstack.com/query/latest

---

## 13. Liên hệ

- Author: ChayNhu04 — chaynhu121234@gmail.com
- License: MIT
