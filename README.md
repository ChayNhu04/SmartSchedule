# SmartSchedule

Ứng dụng quản lý lịch trình & nhắc nhở thông minh — **3 client chia sẻ cùng REST API**.

| Service     | Stack                                                                | Deploy             |
|-------------|----------------------------------------------------------------------|--------------------|
| **backend** | NestJS · TypeORM · PostgreSQL · JWT · Expo Push                      | Render / Fly / VPS |
| **web**     | Next.js 15 · Tailwind · shadcn/ui · TanStack Query · FullCalendar    | Vercel             |
| **mobile**  | React Native (Expo) · Expo Router · Zustand · TanStack Query         | Expo Go / EAS Build|
| **shared**  | TypeScript types & API contracts dùng chung cho cả 3 client          | (workspace)        |

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

Dự án có **82 test cases** (45 unit tests + 37 E2E tests) cho backend.

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

### Test Coverage

| Module | Unit Tests | E2E Tests | Total |
|--------|-----------|-----------|-------|
| Auth | 12 | 12 | 24 |
| Schedules | 20 | 25 | 45 |
| Reminders | 13 | 0 | 13 |
| **TOTAL** | **45** | **37** | **82** |

---

## Tính năng (tóm tắt)

- 🔐 Đăng ký / đăng nhập (JWT) — chung cho web + mobile
- 📅 CRUD lịch (task / meeting / event / reminder)
- 🟢🟡🔴 Mức ưu tiên + 🔁 lịch lặp (daily/weekly/monthly + interval + until)
- 🏷️ Tag · 📋 Template · 👥 Chia sẻ (view-only)
- 🔔 Reminder cron mỗi phút + push notification (mobile)
- 📅 Calendar view (web — FullCalendar)
- 🔍 Tìm kiếm + 📊 Thống kê
- 📜 Audit log
- ⚙️ Cài đặt (timezone, working hours, default remind)

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

## License

MIT
