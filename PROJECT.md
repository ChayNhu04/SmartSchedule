# SmartSchedule — Tài liệu dự án

> Mọi thứ về dự án: kiến trúc, tech stack, data model, API, mobile, deploy, roadmap.
> Tham khảo nhanh: [README.md](./README.md) — quickstart và lệnh thường dùng.

---

## 1. Mục tiêu

SmartSchedule là **app quản lý lịch trình & nhắc nhở thông minh**, lấy cảm hứng từ
[BotThoiGianBieu](https://github.com/dinhvien04/BotThoiGianBieu) (Mezon bot)
nhưng được tái cấu trúc thành **monorepo 4 package** chia sẻ chung REST API:

- **`backend/`** — NestJS expose REST API thuần (không Mezon, không Discord).
- **`web/`** — Next.js 15 (App Router) + Tailwind + shadcn/ui — giao diện desktop.
- **`mobile/`** — Expo / React Native — giao diện mobile.
- **`shared/`** — `@smartschedule/shared` package: TypeScript types & API contracts dùng chung cho cả 3.
- **Push notification** thay cho channel message của bot — gửi qua Expo Push (mobile).

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
| Web              | Next.js 15 (App Router) · React 19 · Tailwind CSS · shadcn/ui (Radix) · FullCalendar |
| Web state        | Zustand (auth) · TanStack Query (server state)                       |
| Web auth         | JWT trong `localStorage` (axios interceptor đính Bearer)            |
| Mobile           | Expo SDK 52 · React Native 0.76 · Expo Router 4 · TypeScript         |
| Mobile state     | Zustand (auth) · TanStack Query (server state)                       |
| Mobile storage   | AsyncStorage (token persistence)                                     |
| Mobile notif     | `expo-notifications` + Expo Push                                     |
| Workspace        | pnpm 9 workspaces (`backend`, `web`, `mobile`, `shared`)             |
| Container        | Multi-stage Dockerfile (Node 20-alpine), docker-compose              |
| CI               | GitHub Actions (typecheck shared / lint + build + test backend / typecheck + build web / typecheck mobile) |

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
├── web/                              # Next.js 15 + Tailwind + shadcn/ui
│   ├── app/
│   │   ├── layout.tsx                # root + Providers (QueryClient, Toaster)
│   │   ├── globals.css               # Tailwind + CSS vars (light/dark)
│   │   ├── page.tsx                  # gateway: /login hoặc /today
│   │   ├── login/page.tsx · register/page.tsx
│   │   └── (app)/                    # group có sidebar + auth guard
│   │       ├── layout.tsx            # AppShell (sidebar nav)
│   │       ├── today/ upcoming/ overdue/ calendar/ search/
│   │       └── tags/ templates/ settings/
│   ├── components/
│   │   ├── ui/                       # shadcn primitives (Button, Card, Dialog, …)
│   │   ├── schedule/                 # ScheduleCard / ScheduleFormDialog / ScheduleList
│   │   └── app-shell.tsx             # sidebar layout
│   ├── lib/                          # api.ts (axios), utils.ts (cn)
│   ├── hooks/                        # use-auth.ts (Zustand)
│   ├── tailwind.config.ts · components.json · next.config.mjs
│   └── package.json
├── mobile/
│   ├── app/                          # Expo Router (file-based)
│   │   ├── _layout.tsx               # QueryClient + GestureHandler + SafeArea
│   │   ├── index.tsx                 # gateway → /(auth) hoặc /(tabs)
│   │   ├── (auth)/                   # login / register
│   │   └── (tabs)/                   # today / upcoming / add / search / settings
│   ├── components/                   # ScheduleCard, …
│   ├── services/                     # api.ts (axios), notifications.ts (Expo Push)
│   ├── hooks/                        # useAuthStore (Zustand)
│   ├── types/                        # re-export từ @smartschedule/shared
│   ├── app.json · babel.config.js
│   └── package.json
├── shared/                           # @smartschedule/shared
│   ├── src/index.ts                  # types: Schedule, Tag, AuthUser, …
│   ├── tsconfig.json
│   └── package.json
├── docker-compose.yml                # postgres + backend
├── pnpm-workspace.yaml
├── package.json                      # workspace root scripts
├── .github/workflows/ci.yml          # 4 jobs (shared / backend / web / mobile)
├── .env.example
├── README.md
├── PROJECT.md                        # ⟵ tài liệu này
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
- Health check: `GET /api/health` — trả `{ status, db, uptime_seconds, timestamp }`. Không yêu cầu auth.

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
| GET    | `/api/schedules/upcoming?limit=N&tag_id=ID` | N lịch pending sắp tới (lọc theo `tag_id` nếu có)                                                          |
| GET    | `/api/schedules/overdue`            | Pending + start < now                                                                                            |
| GET    | `/api/schedules/search?q=keyword`   | ILIKE title/description                                                                                          |
| GET    | `/api/schedules/stats?range=tuan\|thang\|nam` | Total, completionRate, byPriority, byType                                                              |
| GET    | `/api/schedules/export.ics`         | Xuất toàn bộ lịch dạng iCalendar (RFC 5545) — import vào Google/Outlook/Apple Calendar                           |
| GET    | `/api/schedules/:id`                | Detail (kèm tags)                                                                                                |
| PATCH  | `/api/schedules/:id`                | Update partial                                                                                                   |
| POST   | `/api/schedules/:id/complete`       | Đánh dấu completed + acknowledged_at = now                                                                       |
| DELETE | `/api/schedules/:id`                | Xoá hẳn                                                                                                          |
| GET    | `/api/schedules/:id/history`        | Audit log paginate                                                                                               |

### Health
| Method | Endpoint        | Mô tả                                                  |
|--------|-----------------|--------------------------------------------------------|
| GET    | `/api/health`   | Liveness + DB probe (không cần auth, dùng cho monitor) |

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

## 7b. Web app (Next.js)

### 7b.1 Stack & lý do chọn

| Thành phần          | Công nghệ                              | Lý do |
|---------------------|----------------------------------------|--------|
| Framework           | **Next.js 15** (App Router, RSC)        | Server components, file-based routing, edge runtime, deploy 1-click Vercel |
| UI                  | **Tailwind CSS** + **shadcn/ui** (Radix) | Component primitives accessible, copy-paste → tự do tuỳ biến, theme CSS vars |
| Calendar            | **FullCalendar** (`@fullcalendar/react`) | Month / week / day view hoàn chỉnh, drag-drop, events |
| State               | Zustand + TanStack Query                | Trùng pattern với mobile — dễ bảo trì |
| Auth                | JWT trong `localStorage` + axios interceptor | Tương đồng mobile, không cần NextAuth |
| Toast               | `sonner`                                | API ngắn gọn, có rới rich colors |

### 7b.2 Routing

```
app/
├── layout.tsx                # root: Providers (QueryClient, Toaster)
├── page.tsx                  # gateway: hydrate auth → /login hoặc /today
├── login/page.tsx · register/page.tsx
└── (app)/                    # route group — có sidebar
    ├── layout.tsx            # AppShell (auth guard + sidebar nav)
    ├── today/page.tsx        # GET /api/schedules/today
    ├── upcoming/page.tsx     # GET /api/schedules/upcoming
    ├── overdue/page.tsx      # GET /api/schedules/overdue
    ├── calendar/page.tsx     # FullCalendar (month/week/day)
    ├── search/page.tsx       # GET /api/schedules/search
    ├── tags/page.tsx         # GET/POST/DELETE /api/tags
    ├── templates/page.tsx    # GET/POST/DELETE /api/templates + instantiate
    └── settings/page.tsx     # GET/PATCH /api/users/me/settings
```

### 7b.3 Layout

`AppShell` (<ref_file file="web/components/app-shell.tsx" /> theo ngữ cảnh repo) chứa:
- Sidebar 256px bên trái với 8 link nav + email user + nút Đăng xuất.
- Auth guard: nếu không có token → redirect `/login`.
- Main content scrollable.

### 7b.4 shadcn/ui primitives

Đã scaffold sẵn: `Button`, `Input`, `Label`, `Textarea`, `Card`, `Badge`, `Dialog`, `Select`, `Switch`. Thêm component mới bằng:

```bash
cd web
npx shadcn@latest add <component-name>
```

### 7b.5 API client + auth

`web/lib/api.ts` — axios instance + request interceptor đính `Authorization: Bearer <token>`. Response 401 → logout + redirect `/login`. Tương đương `mobile/services/api.ts`.

`web/hooks/use-auth.ts` — Zustand store với `token`, `user`, `hydrate()` đọc từ `localStorage`, `setAuth()`, `logout()`.

### 7b.6 Màn hình nổi bật

- **Calendar view**: FullCalendar với 3 view (month/week/day), màu theo priority (xanh/vàng/đỏ), click event → mở dialog edit.
- **Schedule form dialog**: dialog dùng chung cho create + edit, có datetime-local picker, item type, priority, recurrence.
- **Templates page**: tạo template + dialog "Instantiate" để clone thành schedule mới.

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

> Cần runbook step-by-step cho **Railway + Neon Postgres**? Xem [`docs/deployment-railway.md`](./docs/deployment-railway.md) — bao gồm config monorepo Root Directory, env vars, migration SQL, smoke test, troubleshooting và checklist rotate credentials.

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

### 8.3 Web (Vercel — khuyến nghị)

1. Vào https://vercel.com/new → Import GitHub repo `SmartSchedule`.
2. **Root Directory**: `web`.
3. Framework auto-detect = **Next.js**.
4. Set environment variable:
   - `NEXT_PUBLIC_API_URL = https://<backend-domain>/api`
5. Deploy. Vercel sẽ:
   - Build lại mỗi khi push vào `main`.
   - Tạo preview URL cho mỗi PR.
   - Cấp HTTPS sẵn + Edge CDN toàn cầu.

> Vercel hỗ trợ pnpm workspace tự động — detect `pnpm-workspace.yaml` và cài shared package qua symlink.

Nếu muốn tự host: `pnpm --filter smartschedule-web build` → chạy `pnpm --filter smartschedule-web start` (port 3000) sau Nginx reverse proxy.

### 8.4 Mobile build

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

### 8.5 CI

`.github/workflows/ci.yml` chạy 4 job song song trên Ubuntu 24.04 + Node 20 + pnpm 9:

- Job **shared**: `pnpm --filter @smartschedule/shared typecheck`.
- Job **backend**: `pnpm --filter smartschedule-backend lint + build + test`.
- Job **web**: `pnpm --filter smartschedule-web typecheck + build`.
- Job **mobile**: `pnpm --filter smartschedule-mobile typecheck`.

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
- [x] Mobile: detail screen + edit form (PR #22)
- [x] Mobile: recurrence picker (UI chọn daily/weekly/monthly + interval + until)
- [x] Mobile: tag chips trong schedule card (PR #30) + filter theo tag (Sắp tới)
- [ ] Mobile: stats charts (Victory Native hoặc react-native-svg)
- [~] Backend: import Excel (`xlsx` đã cài) + import/export `.ics` — **export `.ics` xong** (`GET /api/schedules/export.ics`); import Excel/ICS chưa làm
- [ ] Backend: undo service (xoá / hoàn-thành) trong 10 phút (in-memory)
- [x] Backend: working hours — reminder ngoài khung dồn về đầu khung kế tiếp
- [x] Health check `/api/health`
- [ ] Unit + e2e test cover ≥80%

### v0.3 (xa)
- [x] Quick add tiếng Việt (NLP datetime parser) — PR #36
- [ ] Calendar month view (mobile)
- [ ] Đa người trong cùng lịch (collaborative edit)
- [x] Web app (Next.js + Tailwind + shadcn/ui) — đã scaffold
- [ ] Web: drag-drop trên Calendar để dời giờ
- [x] Web: dark mode toggle
- [x] Web: stats charts — `/stats` (CSS bar + segmented progress, không phụ thuộc lib chart)
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
