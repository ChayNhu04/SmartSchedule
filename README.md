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
```

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
   │  Vercel    │       │  Render Docker│       │  Postgres │
   └────────────┘       └───────────────┘       └───────────┘
                                ▲
                                │
                       ┌────────┴────────┐
                       │   mobile        │
                       │   Expo Go / EAS │
                       └─────────────────┘
```

- **Web**: Vercel detect Next.js, set `NEXT_PUBLIC_API_URL` → deploy.
- **Backend**: Render / Fly với Dockerfile có sẵn, kết nối Neon Postgres.
- **Mobile**: `eas build` ra APK / IPA hoặc Expo Go cho dev.

Hướng dẫn từng bước trong [`PROJECT.md` mục Deploy](./PROJECT.md#8-deploy).

## License

MIT
