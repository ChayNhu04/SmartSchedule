# Deploy backend lên Railway + Neon Postgres

Runbook deploy backend SmartSchedule (NestJS) lên [Railway](https://railway.app) với database [Neon](https://neon.tech). Áp dụng cho tất cả môi trường (staging / production) — chỉ khác nhau ở env vars.

> Web (Next.js) deploy bằng Vercel — xem [`PROJECT.md` §8.3](../PROJECT.md#83-web-vercel--khuyến-nghị). Mobile build bằng EAS — xem [`PROJECT.md` §8.4](../PROJECT.md#84-mobile-build).

---

## TL;DR

| Component | Service | Notes |
|---|---|---|
| Backend (NestJS Docker) | Railway | Dockerfile có sẵn ở `backend/Dockerfile`, root dir = `backend` |
| Database (Postgres 16) | Neon | Pooled connection, `sslmode=require`, `DATABASE_SSL=true` |
| Frontend web | Vercel | `NEXT_PUBLIC_API_URL` trỏ về Railway domain |
| Frontend mobile | Expo Go (dev) / EAS (prod) | `EXPO_PUBLIC_API_URL` trỏ về Railway domain |

Chi phí free tier: Railway $5/tháng credit (đủ ~500h compute idle), Neon 0.5 GB / 191 compute-hours.

---

## 1. Chuẩn bị

### 1.1 Tạo Neon project
1. Đăng nhập https://console.neon.tech.
2. **New Project** → đặt tên (vd `smartschedule-prod`) → chọn region gần Railway region (vd `us-east-1` cho Railway US East).
3. Copy connection string ở dạng **Pooled connection** (URL có chữ `-pooler`):
   ```
   postgresql://<user>:<password>@<project>-pooler.<region>.aws.neon.tech/<db>?sslmode=require&channel_binding=require
   ```
4. Lưu lại — sẽ dùng ở §3.

> **Bảo mật**: connection string chứa password. Không paste vào chat, log, hay commit. Nếu lỡ lộ thì vào Neon → Settings → **Reset password** ngay.

### 1.2 Tạo `JWT_SECRET`
```bash
openssl rand -hex 32
```
Lưu output — sẽ dùng ở §3. Đừng dùng password ngắn hoặc giá trị mặc định (`change-me`); JWT của tất cả user phụ thuộc vào key này.

---

## 2. Tạo Railway service

1. https://railway.app → **New Project** → **Deploy from GitHub repo** → chọn `ChayNhu04/SmartSchedule`.
2. Railway sẽ tạo 1 service và cố build ngay → build SẼ FAIL vì repo là monorepo. Bình thường — sang bước 3.
3. **KHÔNG** add Postgres add-on (dùng Neon).

### 2.1 Trỏ service vào subfolder
Vào service → tab **Settings**:

**Source** section:
| Field | Giá trị |
|---|---|
| Root Directory | `backend` |
| Watch Paths | `backend/**` (tránh redeploy khi sửa web/mobile/shared) |

**Build** section:
| Field | Giá trị |
|---|---|
| Builder | `Dockerfile` (Railway tự dò ra `backend/Dockerfile`) |

Save → Railway auto-redeploy.

---

## 3. Đặt environment variables

Service backend → tab **Variables** → **Raw Editor** → paste:

```env
DATABASE_URL=postgresql://<user>:<password>@<project>-pooler.<region>.aws.neon.tech/<db>?sslmode=require&channel_binding=require
DATABASE_SSL=true
JWT_SECRET=<32-byte-hex-từ-openssl-rand>
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://<web-domain>
EXPO_ACCESS_TOKEN=
```

Lưu ý:

| Var | Bắt buộc | Ghi chú |
|---|---|---|
| `DATABASE_URL` | ✓ | URL pooled từ Neon §1.1 |
| `DATABASE_SSL` | ✓ | Phải = `true` cho Neon (cert chain Neon ký bằng intermediate Node reject mặc định) — code đọc flag này ở `backend/src/config/database.config.ts:9-13` và bật `rejectUnauthorized: false` |
| `JWT_SECRET` | ✓ | Đừng để mặc định, đừng đổi sau khi user đã đăng nhập (sẽ invalidate hết JWT cũ) |
| `JWT_EXPIRES_IN` | optional | Mặc định `7d`. Format theo [vercel/ms](https://github.com/vercel/ms): `60s`, `2h`, `7d`, … |
| `NODE_ENV` | optional | `production` để Nest tắt verbose log |
| `PORT` | optional | Railway auto-inject `PORT=8080` nếu không set; Nest đọc `process.env.PORT ?? '3000'` nên cả 2 đều OK |
| `CORS_ORIGIN` | ✓ | Domain web Vercel. Nhiều domain cách bằng dấu phẩy: `https://a.com,https://b.com`. Mobile app native KHÔNG cần thêm origin (CORS chỉ áp dụng browser) |
| `EXPO_ACCESS_TOKEN` | optional | Chỉ cần nếu muốn nhận push receipts. Tạo ở https://expo.dev/accounts/<you>/settings/access-tokens |

---

## 4. Generate public domain

Service backend → **Settings** → **Networking** → **Generate Domain**.

Railway cấp URL kiểu:
```
https://smartschedule-backend-production.up.railway.app
```

Smoke test:
```bash
curl -I https://<railway-domain>/api/docs
# HTTP/2 200
```

Nếu trả 502 → check **Deploy Logs** xem service crash lúc start (thường là DB connection fail).

---

## 5. Migration lần đầu lên Neon

Repo có 1 file SQL khởi tạo schema: [`backend/migrations/001-init.sql`](../backend/migrations/001-init.sql). Trên local docker-compose, file này được mount vào `/docker-entrypoint-initdb.d/` và chạy tự động khi Postgres init lần đầu — nhưng **Neon không có cơ chế đó**, phải apply thủ công.

### Cách 1 — Neon SQL Editor (khuyên dùng)
1. https://console.neon.tech → project → **SQL Editor**.
2. Mở `backend/migrations/001-init.sql` ở local, copy toàn bộ.
3. Paste vào editor → **Run**.
4. Verify: chạy `\dt` hoặc:
   ```sql
   SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY 1;
   ```
   Phải thấy: `audit_logs`, `notifications`, `schedule_shares`, `schedules`, `tags`, `templates`, `users`, …

### Cách 2 — psql từ máy local
```bash
psql "$DATABASE_URL" -f backend/migrations/001-init.sql
```

### Cách 3 — Railway run (chạy psql trong môi trường Railway)
```bash
npm i -g @railway/cli
railway login
railway link        # chọn project
railway run sh -c 'apk add --no-cache postgresql-client && psql "$DATABASE_URL" -f backend/migrations/001-init.sql'
```

> Khi cần thêm migration mới sau này, đặt file `backend/migrations/00N-<name>.sql` và lặp lại §5 cho file mới. Repo hiện chưa dùng TypeORM migrations runtime — schema management thuần SQL files.

---

## 6. Trỏ frontend về Railway domain

### 6.1 Web (Vercel)
Vercel project → **Settings** → **Environment Variables**:
```
NEXT_PUBLIC_API_URL=https://<railway-domain>/api
```
Apply ở cả 3 environments (Production / Preview / Development) hoặc chỉ Production tuỳ ý. Redeploy: tự động khi push, hoặc bấm **Redeploy** ở Vercel.

### 6.2 Mobile
**Local dev**: chỉnh `mobile/.env`:
```
EXPO_PUBLIC_API_URL=https://<railway-domain>/api
```
Restart Metro với `--clear`:
```bash
pnpm --filter smartschedule-mobile start --clear
```
Reload Expo Go trên thiết bị.

**Production build (EAS)**: env vars `EXPO_PUBLIC_*` được inline vào bundle lúc build. Set ở `eas.json` per-profile, hoặc dùng EAS environment variables (https://docs.expo.dev/eas/environment-variables/).

---

## 7. Smoke test end-to-end

```bash
RAILWAY_URL=https://<railway-domain>

# 1. Đăng ký user
curl -X POST $RAILWAY_URL/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"smoke@example.com","password":"password123","fullName":"Smoke"}'
# Expected: 201 với { access_token: "..." }

# 2. Đăng nhập
TOKEN=$(curl -s -X POST $RAILWAY_URL/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"smoke@example.com","password":"password123"}' | jq -r .access_token)
echo "Token: ${TOKEN:0:20}..."

# 3. Tạo schedule
curl -X POST $RAILWAY_URL/api/schedules \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Smoke test",
    "start_time": "2026-05-01T02:00:00.000Z",
    "priority": "medium",
    "item_type": "task",
    "recurrence_type": "none"
  }'
# Expected: 201 với schedule object
```

Cả 3 request phải trả `2xx`. Nếu (1) fail với 500/database error → DB chưa migrate (về §5). Nếu (3) fail với 401 → `JWT_SECRET` đã đổi giữa các restart, hoặc Railway có 2 replica với secret khác nhau.

---

## 8. Troubleshooting

| Triệu chứng | Nguyên nhân | Fix |
|---|---|---|
| `Error: self-signed certificate in certificate chain` lúc start | Thiếu `DATABASE_SSL=true` | Thêm var, redeploy |
| `password authentication failed for user "neondb_owner"` | Sai password (vd dùng password đã rotate) | Reset trên Neon → paste password mới vào Railway Variables |
| `endpoint is disabled` (5xx, log Neon "compute idle") | Compute Neon tự suspend sau 5 phút idle (free tier) | Bình thường — request đầu tiên wake compute trong ~1-2s. Hoặc upgrade Neon Scale plan để tắt suspend. |
| `too many connections` | Pool đầy do mỗi cold-start tạo pool mới | Dùng URL có `-pooler` (Neon PgBouncer) — đã làm ở §1.1 |
| Service crash log `ECONNREFUSED 127.0.0.1:5432` | Quên set `DATABASE_URL`, app fallback localhost | Thêm var, redeploy |
| Web POST từ browser bị CORS | `CORS_ORIGIN` không khớp domain web | Update var với domain Vercel chính xác (kèm `https://`), redeploy backend |
| `relation "users" does not exist` lúc register | Migration chưa apply | Về §5 |
| Nest start nhưng `/api/*` trả 404 | Quên `app.setGlobalPrefix('api')` (đã có sẵn ở `backend/src/main.ts:14`) — không phải bug, kiểm tra lại bạn có gọi đúng path `/api/auth/login` không |
| Sau khi đổi `JWT_SECRET`, user đăng xuất hàng loạt | Bình thường — JWT cũ không verify được | Phải đăng nhập lại; trong production tránh đổi `JWT_SECRET` trừ khi khẩn cấp |

---

## 9. Rotate credentials checklist

Khi nghi credential bị lộ (vd lộ trong chat, log, screenshot):

1. **Neon password**: Console → Settings → Reset password → copy URL mới → Railway Variables → `DATABASE_URL` → Save → Railway auto-redeploy.
2. **JWT_SECRET**: generate `openssl rand -hex 32` → Railway Variables → Save. Tất cả user sẽ phải đăng nhập lại — chấp nhận downtime UX.
3. **Expo Access Token**: revoke ở https://expo.dev/accounts/<you>/settings/access-tokens → tạo mới → update `EXPO_ACCESS_TOKEN`.
4. Xác nhận old credential đã bị reject:
   ```bash
   psql "<old-DATABASE_URL>" -c "SELECT 1"
   # Phải fail với "password authentication failed"
   ```

---

## 10. Maintenance

- **Logs**: Railway service → tab **Deploy Logs** (logs realtime); historical 7 ngày trên free tier.
- **Restart**: Railway service → menu `…` → **Restart Service**. Không mất data (DB ở Neon).
- **Rollback**: Railway service → tab **Deployments** → click commit cũ → **Redeploy**.
- **Scale up**: Railway service → **Settings** → **Resources** → tăng RAM/CPU. Free tier giới hạn 512MB RAM, 1 vCPU.
- **Custom domain**: Railway service → **Settings** → **Networking** → **Custom Domain** → thêm CNAME ở DNS → Railway tự issue Let's Encrypt cert.
- **Backup Neon**: Console → Branches → tạo branch read-only theo định kỳ, hoặc dùng `pg_dump` cron từ máy bạn.

---

## Tham khảo
- Railway Docs: https://docs.railway.app
- Neon Docs: https://neon.tech/docs
- NestJS env config: https://docs.nestjs.com/techniques/configuration
- File env mẫu: [`backend/.env.example`](../backend/.env.example)
- Tổng quan deploy chung: [`PROJECT.md` §8](../PROJECT.md#8-deploy)
