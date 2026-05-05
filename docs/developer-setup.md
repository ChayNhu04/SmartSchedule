# Setup môi trường dev local

Tài liệu cho dev mới vào dự án. Mục tiêu: **30 phút từ clone đến cả 3 client chạy được trên máy local**.

## 1. Yêu cầu hệ thống

| Tool | Version tối thiểu | Ghi chú |
|---|---|---|
| Node.js | 20.x LTS | Cùng version với CI và Dockerfile |
| pnpm | 9.x | `corepack enable && corepack prepare pnpm@9.15.0 --activate` |
| Docker + Docker Compose | mới (≥ 24) | Để chạy Postgres local. Dùng Neon thay thế cũng OK. |
| Git | bất kỳ | |

Khuyến nghị thêm:
- **Expo Go** trên điện thoại (App Store / Play Store) để test mobile.
- **psql** CLI để chạy migration thủ công.

## 2. Clone repo + cài deps

```bash
git clone https://github.com/ChayNhu04/SmartSchedule.git
cd SmartSchedule
pnpm install                # cài tất cả workspace package
```

Repo là **pnpm workspace** với 4 package (xem `pnpm-workspace.yaml`):

```
backend/   → smartschedule-backend  (NestJS)
web/       → smartschedule-web      (Next.js)
mobile/    → smartschedule-mobile   (Expo)
shared/    → @smartschedule/shared  (types only)
```

## 3. Env files

### Root `.env` (cho `docker-compose`)

```bash
cp .env.example .env
# mở .env, đổi JWT_SECRET ít nhất
```

Các biến quan trọng (xem chi tiết trong [`../backend/.env.example`](../backend/.env.example)):

| Biến | Mặc định local | Mô tả |
|---|---|---|
| `DATABASE_URL` | `postgres://postgres:postgres@db:5432/smartschedule` | URL Postgres |
| `DATABASE_SSL` | `false` (local), `true` (Neon/Railway) | |
| `JWT_SECRET` | `change-me-in-production` | **PHẢI đổi** trước khi share env hoặc deploy |
| `JWT_EXPIRES_IN` | `7d` | |
| `CORS_ORIGIN` | `*` | List origin allow, cách bằng dấu phẩy |
| `EXPO_ACCESS_TOKEN` | rỗng | Optional — chỉ cần nếu test push receipts |

### Mobile `.env`

```bash
cp mobile/.env.example mobile/.env
```

Sửa `EXPO_PUBLIC_API_URL`:
- **Simulator / web preview**: `http://localhost:3000/api`
- **Thiết bị thật**: thay `localhost` bằng **IP LAN máy bạn** (vd `http://192.168.1.10:3000/api`). `localhost` trên điện thoại trỏ về điện thoại, KHÔNG phải máy dev.

### Web `.env.local` (Next.js convention)

```bash
echo 'NEXT_PUBLIC_API_URL=http://localhost:3000/api' > web/.env.local
```

> Lưu ý: tất cả env var có prefix `EXPO_PUBLIC_` (mobile) và `NEXT_PUBLIC_` (web) đều **được nhúng vào bundle build-time** — không phải secret runtime. Đừng bỏ key API thật vào đây.

## 4. Database

### Cách 1 — Postgres qua Docker (mặc định)

```bash
docker compose up -d db        # chỉ start service db
docker compose logs -f db      # đợi đến khi thấy "database system is ready to accept connections"
```

Schema khởi tạo tự động: file `backend/migrations/001-init.sql` được mount vào `/docker-entrypoint-initdb.d/` của container Postgres và chạy lần đầu init. Nếu volume `db-data` đã tồn tại từ lần trước thì migration KHÔNG re-run — phải xoá:

```bash
docker compose down -v        # cẩn thận: xoá hết data
docker compose up -d db
```

### Cách 2 — Neon (cloud, không cần Docker)
Tạo project ở https://console.neon.tech, copy connection string vào `DATABASE_URL`, chạy migration thủ công:

```bash
psql "$DATABASE_URL" -f backend/migrations/001-init.sql
```

Set `DATABASE_SSL=true` cho Neon.

## 5. Backend

```bash
# Cách A: chạy qua docker-compose (cùng container với db)
docker compose up -d --build
docker compose logs -f backend

# Cách B: chạy trực tiếp, dev mode (hot reload)
pnpm dev:backend
# == pnpm --filter smartschedule-backend start:dev
```

Endpoint:
- API: http://localhost:3000/api
- Swagger UI: http://localhost:3000/api/docs

Smoke test:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"dev@test.com","password":"password123","display_name":"Dev"}'
```

Phải trả `201` với `{ access_token, user }`.

## 6. Web

```bash
# Backend chiếm 3000 — chạy web trên 3001:
PORT=3001 pnpm dev:web
# == PORT=3001 pnpm --filter smartschedule-web dev
```

Nếu không đặt `PORT`, Next.js sẽ tự detect 3000 bị chiếm và fallback 3001 (in `⚠ Port 3000 is in use, trying 3001`).

- Mở http://localhost:3001
- Đăng nhập bằng tài khoản vừa tạo ở §5.
- Nếu gọi backend trên port khác, nhớ cập nhật `web/.env.local` rồi restart dev server.

## 7. Mobile (Expo)

```bash
pnpm dev:mobile
# == pnpm --filter smartschedule-mobile start
```

Metro bundler chạy ở `localhost:8081`. Chọn cách test:

### A. Expo Go trên thiết bị thật (khuyên dùng)
1. Mở Expo Go (cài từ store).
2. Quét QR Metro hiển thị, hoặc nhập URL `exp://<LAN-IP>:8081`.
3. Đảm bảo điện thoại + máy dev cùng WiFi.

### B. iOS Simulator (Mac)
```bash
pnpm --filter smartschedule-mobile ios
```

### C. Android Emulator
```bash
pnpm --filter smartschedule-mobile android
```

### D. Web (nhanh để debug UI, không phản ánh đúng native)
```bash
pnpm --filter smartschedule-mobile web
```

Một số API native KHÔNG chạy trên web (vd `Alert.alert` no-op, `expo-notifications` không hoạt động) — đừng dựa vào web để test push.

## 8. Lệnh tổng hợp

| Lệnh | Tác dụng |
|---|---|
| `pnpm install` | Cài tất cả deps |
| `pnpm lint` | Lint song song toàn workspace |
| `pnpm typecheck` | Typecheck song song |
| `pnpm build` | Build tất cả package |
| `pnpm test` | Chạy test (chủ yếu là backend Jest) |
| `pnpm test:e2e` | Backend e2e test (cần PostgreSQL) |
| `pnpm test:unit` | Backend unit tests (không cần DB) |
| `pnpm test:cov` | Backend test + coverage report |
| `pnpm dev:backend` / `dev:web` / `dev:mobile` | Chạy từng client ở dev mode |

## 9. Workflow Git

- Branch convention: `devin/<unix-ts>-<topic>` (do session Devin tạo) hoặc `feat/<topic>`, `fix/<topic>`.
- PR vào `main`. CI sẽ chạy các job: shared typecheck, backend lint+build+test, web typecheck+build, mobile typecheck, Vercel preview (xem `.github/workflows/ci.yml`).
- PR phải xanh CI trước khi merge.
- Repo hiện **không** có `.pre-commit-config.yaml` — không cần `pre-commit install`.

## 10. Troubleshooting setup

Nếu vướng → xem [`troubleshooting.md`](./troubleshooting.md). Vài lỗi đầu thường gặp:

- **`pnpm: command not found`** → `corepack enable`.
- **Backend khởi động báo `ECONNREFUSED 127.0.0.1:5432`** → Postgres chưa chạy. `docker compose up -d db`.
- **Mobile báo "Network Error" lúc đăng nhập trên thiết bị thật** → `EXPO_PUBLIC_API_URL` đang trỏ `localhost`. Đổi sang IP LAN.
- **Web báo CORS** → `CORS_ORIGIN` ở backend không khớp. Set thành `*` (chỉ dev) hoặc URL chính xác (vd `http://localhost:3001`).

## 11. Smoke test sau setup

Sau khi 3 client chạy được, kiểm tra nhanh:

```bash
# Backend health (không cần auth)
curl http://localhost:3000/api/health
# Kỳ vọng: {"status":"ok","db":"up","uptime_seconds":...,"timestamp":"..."}

# Backend Swagger
open http://localhost:3000/api/docs   # hoặc mở trong browser
```

Trên web (`http://localhost:3001`): đăng ký → tạo lịch → xoá → bấm "Hoàn tác" trên toast trong vòng 10 phút → lịch quay về.

Trên mobile: đăng nhập → gõ "mai 9h họp scrum" vào ô "Thêm nhanh" → lich được tạo ở tab Sắp tới.
