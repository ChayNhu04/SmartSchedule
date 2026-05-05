# SmartSchedule

Ứng dụng quản lý lịch trình & nhắc nhở thông minh — **3 client chia sẻ cùng REST API**.

| Service     | Stack                                                                | Deploy             |
|-------------|----------------------------------------------------------------------|--------------------|
| **backend** | NestJS 10 · TypeORM · PostgreSQL · JWT · Expo Push · @nestjs/schedule | Railway / Render / Fly / VPS |
| **web**     | Next.js 15 · Tailwind · shadcn/ui · TanStack Query · FullCalendar · Sonner toast | Vercel             |
| **mobile**  | React Native (Expo SDK 54+) · Expo Router · Zustand · TanStack Query · expo-notifications | Expo Go / EAS Build|
| **shared**  | TypeScript types & API contracts dùng chung cho cả 3 client + parser ngôn ngữ tự nhiên (`parse-vi`) | (workspace)        |

> Tài liệu kiến trúc đầy đủ: [`PROJECT.md`](./PROJECT.md)

---

## Cấu trúc monorepo (pnpm workspace)

```
SmartSchedule/
├── backend/           # NestJS REST API
├── web/               # Next.js (App Router)
├── mobile/            # Expo (React Native)
├── shared/            # @smartschedule/shared — types
├── docker-compose.yml
├── pnpm-workspace.yaml
├── .github/workflows/ci.yml
└── PROJECT.md
```

## Khởi động nhanh

### Cài chung

```bash
git clone https://github.com/ChayNhu04/SmartSchedule.git
cd SmartSchedule
cp .env.example .env
pnpm install                        # cần pnpm 9+
```

### Backend (Docker — khuyên dùng)

```bash
docker compose up -d --build
docker compose logs -f backend
# API: http://localhost:3000/api
# Swagger: http://localhost:3000/api/docs
```

### Backend (chạy trực tiếp)

```bash
pnpm dev:backend                    # nest start --watch
# Đảm bảo có Postgres ở DATABASE_URL trong .env
```

### Web

```bash
cd web
cp .env.example .env                # set NEXT_PUBLIC_API_URL
pnpm dev                            # http://localhost:3001 (default 3000 nếu backend không chiếm)
```

### Mobile

```bash
cd mobile
cp .env.example .env                # set EXPO_PUBLIC_API_URL về IP máy backend
pnpm start                          # Expo dev server, dùng Expo Go quét QR
```

---

## Lệnh chung (root)

```bash
pnpm typecheck       # typecheck mọi package
pnpm lint            # lint mọi package
pnpm build           # build tất cả
pnpm test            # test tất cả
pnpm test:unit       # chỉ unit tests (nhanh, không cần DB)
pnpm test:e2e        # chỉ E2E tests (cần PostgreSQL)
pnpm test:cov        # test với coverage report
```

## Testing

Dự án có **>200 test cases** cho backend (Jest unit + e2e). Cập nhật chính xác sau mỗi PR — chạy `pnpm --filter smartschedule-backend test` để biết số hiện tại.

### Chạy tests nhanh (Unit tests - không cần database)

**Windows:**
```powershell
cd test
.\run-tests.ps1 unit
```

**Linux/Mac:**
```bash
cd test
./run-tests.sh unit
```

### Chạy E2E tests (cần PostgreSQL)

1. Đảm bảo PostgreSQL đang chạy
2. Tạo database test: `CREATE DATABASE smartschedule_test;`
3. Set `DATABASE_URL` trong `backend/.env`
4. Chạy migrations: `psql $DATABASE_URL -f backend/migrations/001-init.sql`
5. Chạy tests:

```powershell
# Windows
cd test
.\run-tests.ps1 e2e

# Linux/Mac
cd test
./run-tests.sh e2e
```

### Documentation

- **[test/README.md](./test/README.md)** - Full testing documentation (English)
- **[test/HUONG-DAN.md](./test/HUONG-DAN.md)** - Hướng dẫn chi tiết (Tiếng Việt)
- **[test/TEST-SUMMARY.md](./test/TEST-SUMMARY.md)** - Test coverage summary

### Module test coverage

Mỗi module backend có spec riêng dưới `test/backend/` và `backend/src/**/*.spec.ts`. Các module có coverage lớn:

| Module | File chính |
|---|---|
| Auth (register/login/JWT) | `test/backend/auth.service.spec.ts`, `auth.e2e.spec.ts` |
| Schedules (CRUD + today/upcoming/overdue/search/stats/undo) | `test/backend/schedules.service.spec.ts`, `schedules.e2e.spec.ts` |
| Reminders (cron + work-hours shift) | `test/backend/reminders.service.spec.ts`, `backend/src/reminders/work-hours.spec.ts` |
| Tags / Templates / Shares / Audit | `test/backend/{tags,templates,shares,audit}.service.spec.ts` |
| Undo store (TTL + LIFO) | `backend/src/schedules/undo.store.spec.ts` |
| ICS export (RFC 5545) | `backend/src/schedules/ics.spec.ts` |
| NLP parser tiếng Việt | `shared/src/parse-vi.spec.ts` |

---

## Tính năng (tóm tắt)

- 🔐 Đăng ký / đăng nhập (JWT) — chung cho web + mobile
- 📅 CRUD lịch (task / meeting / event / reminder) + đánh dấu hoàn thành
- 🟢🟡🔴 Mức ưu tiên + 🔁 lịch lặp (daily/weekly/monthly + interval + until)
- 🏷️ Tag (web + mobile) · 📋 Mẫu lịch (web + mobile, có 4 preset gợi ý) · 👥 Chia sẻ view-only (web + mobile)
- ⌨️ **Thêm nhanh** — gõ `mai 9h họp scrum` để tạo lịch tự nhiên (web + mobile)
- ⏪ **Hoàn tác 10 phút** sau xoá / hoàn thành (web toast + mobile alert)
- 🔔 Reminder cron mỗi phút + push notification — đã wire xong end-to-end. Có **work-hours shift**: reminder ngoài khung giờ làm việc dồn về đầu khung kế tiếp.
- 📅 Calendar view (web — FullCalendar tiếng Việt)
- 🔍 Tìm kiếm + 📊 **Thống kê** (web + mobile, biểu đồ pure CSS/RN, range 7/30/365 ngày)
- 📤 **Xuất iCalendar** (`.ics` — RFC 5545) qua `GET /api/schedules/export.ics`. Mobile share sheet, web tải trực tiếp.
- 📜 Audit log (`/api/audit`) — ghi mọi mutation
- ⚙️ Cài đặt user (timezone, work hours, default remind, push toggle, theme sáng/tối)
- ❤️ Health check `/api/health` (no auth) cho uptime monitor

Chi tiết, API spec, deploy guide xem [`PROJECT.md`](./PROJECT.md).

---

## Deploy production (recommended)

```
   ┌────────────┐       ┌───────────────┐       ┌───────────┐
   │  web       │──────▶│  backend      │──────▶│  Neon     │
   │  Vercel    │       │  Railway      │       │  Postgres │
   └────────────┘       └───────────────┘       └───────────┘
                                ▲
                                │
                       ┌────────┴────────┐
                       │   mobile        │
                       │   Expo Go / EAS │
                       └─────────────────┘
```

- **Web**: Vercel detect Next.js, set `NEXT_PUBLIC_API_URL` → deploy.
- **Backend**: Railway / Render / Fly với Dockerfile có sẵn, kết nối Neon Postgres.
- **Mobile**: `eas build` ra APK / IPA hoặc Expo Go cho dev.

Runbook chi tiết:
- Backend trên **Railway + Neon**: [`docs/deployment-railway.md`](./docs/deployment-railway.md).
- Tổng quan + web/mobile/CI: [`PROJECT.md` §8](./PROJECT.md#8-deploy).
- Tổng hợp tài liệu (`docs/`): [`docs/README.md`](./docs/README.md).

## License

MIT
