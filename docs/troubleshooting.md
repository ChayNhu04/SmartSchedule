# Troubleshooting

Lỗi thường gặp khi dev / deploy SmartSchedule. Sắp xếp theo "lớp" (mobile API URL → CORS → DB → JWT → Expo → deploy).

> Khi vướng push notification cụ thể, xem [`notifications.md` §7](./notifications.md#7-lỗi-thường-gặp). Khi vướng deploy Railway, xem [`deployment-railway.md` §8](./deployment-railway.md#8-troubleshooting). File này tập trung lỗi chung.

---

## 1. Mobile gọi API thất bại

### "Network Error" / `axios timeout`
**Nguyên nhân thường gặp**, theo thứ tự xác suất:

| # | Triệu chứng cụ thể | Fix |
|---|---|---|
| 1 | Test trên **thiết bị thật**, `EXPO_PUBLIC_API_URL=http://localhost:3000/api` | `localhost` trên điện thoại trỏ về điện thoại. Đổi thành **IP LAN máy dev** (`ip a` / `ipconfig getifaddr en0`), vd `http://192.168.1.10:3000/api`. |
| 2 | Backend chưa start | `docker compose up -d backend` hoặc `pnpm dev:backend` |
| 3 | Điện thoại + máy dev khác mạng (4G vs WiFi nhà) | Cùng WiFi, hoặc dùng tunnel (ngrok / cloudflared) |
| 4 | Đổi `.env` mà Metro chưa rebuild bundle | `pnpm --filter smartschedule-mobile start --clear` |
| 5 | Server đang ở HTTP nhưng device chặn cleartext (Android API ≥ 28) | Build dev → cleartext OK trong Expo Go; nếu build production phải có HTTPS |

**Cách verify URL đang dùng**: thêm tạm `console.log(api.defaults.baseURL)` trong `mobile/services/api.ts` rồi reload — nhìn log Metro.

### Mobile vẫn fetch URL cũ sau khi sửa `.env`
- Stop Metro (Ctrl+C).
- `pnpm --filter smartschedule-mobile start --clear` (flag `--clear` quan trọng — clear Metro cache).
- Reload app trong Expo Go.

---

## 2. CORS browser

Triệu chứng: web hoặc Expo Web mở console thấy:
```
Access to XMLHttpRequest at 'http://localhost:3000/api/...' from origin
'http://localhost:3001' has been blocked by CORS policy
```

### Fix
- Đặt `CORS_ORIGIN` ở backend khớp đúng origin web:
  ```
  CORS_ORIGIN=http://localhost:3001
  # hoặc nhiều origin
  CORS_ORIGIN=http://localhost:3001,https://app.example.com
  ```
- Restart backend.
- **Lưu ý đặc biệt**: nếu set `CORS_ORIGIN=*` mà code có `credentials: true` thì browser sẽ TỪ CHỐI (spec). Hai cách:
  1. Set `CORS_ORIGIN` thành domain cụ thể (KHÔNG phải `*`), giữ `credentials: true`.
  2. Hoặc bỏ `credentials: true` ở `app.enableCors(...)` trong `backend/src/main.ts` (chỉ phù hợp nếu không dùng cookie).

### CORS không phải issue trên app native
Mobile (iOS/Android, không phải Expo Web) không bị CORS — đó là cơ chế trình duyệt. Nếu mobile báo lỗi mạng, vào §1, không phải §2.

---

## 3. Database

### `ECONNREFUSED 127.0.0.1:5432` lúc backend start
- Postgres chưa chạy. `docker compose up -d db`.
- Hoặc `DATABASE_URL` chưa set, app fallback localhost (xem `backend/src/config/database.config.ts`).

### `Error: self-signed certificate in certificate chain`
- Postgres có SSL self-signed (Neon, Supabase, Railway Postgres).
- Set `DATABASE_SSL=true` → code bật `rejectUnauthorized: false`.

### `password authentication failed for user "postgres"`
- Sai password trong `DATABASE_URL`.
- Nếu là Neon/Railway, password có thể đã rotate → lấy URL mới từ console.

### `relation "users" does not exist`
- Migration chưa chạy.
- Local docker: `docker compose down -v && docker compose up -d` (volume reset).
- Neon: `psql "$DATABASE_URL" -f backend/migrations/001-init.sql`.

### `too many connections`
- Hết slot pool. Neon: dùng URL có `-pooler` (PgBouncer) thay vì direct.
- Local: chỉnh `max_connections` trong Postgres config (mặc định 100, thường thừa).

### Schema cũ sau khi đổi entity TypeORM
- Repo có `synchronize: false` ([`backend/src/config/database.config.ts`](../backend/src/config/database.config.ts)) — schema chỉ thay đổi qua file SQL trong `backend/migrations/`.
- Quy trình: viết file `00N-<name>.sql`, apply thủ công lên DB từng môi trường.
- **Đề xuất bổ sung**: chuyển sang TypeORM migrations chính thức (`pnpm typeorm migration:generate`) cho versioning rõ hơn — hiện chưa làm.

---

## 4. JWT

### Mọi request trả 401 Unauthorized
1. Token đã hết hạn (`JWT_EXPIRES_IN` mặc định 7d). → Login lại.
2. `JWT_SECRET` đã đổi giữa các lần restart backend. Token cũ verify fail. → Login lại.
3. Multi-instance backend (Railway scale ≥ 2) với `JWT_SECRET` khác nhau. → Set var ở project-level, không service-instance-level.

### "Cannot read property 'id' of undefined" trong controller dùng `@CurrentUser()`
- Quên `@UseGuards(AuthGuard('jwt'))` trên controller hoặc method.
- Kiểm: `backend/src/auth/jwt.strategy.ts` chỉ set `req.user` nếu guard chạy.

### Web `localStorage.auth_token` mất sau refresh
- Server không lưu — chỉ client. Bình thường nếu user xoá browser data.
- Logic 401 → tự xoá token + redirect `/login` (xem `web/lib/api.ts`).

### Mobile `auth_token` mất
- AsyncStorage clear khi reinstall app.
- Hoặc bug `useAuthStore.logout()` được gọi nhầm.

---

## 5. Expo notification

→ Đầy đủ trong [`notifications.md`](./notifications.md). Tóm tắt:

| Triệu chứng | Fix |
|---|---|
| Token = null | Đang trên simulator/web. Test thiết bị thật. |
| Push không đến dù có schedule due | Check `users.notify_via_push = true` (settings có toggle), và `expo_push_token IS NOT NULL` ở DB |
| Push bị dời sang giờ khác | Đúng — reminder ngoài `work_start_hour..work_end_hour` (theo timezone user) sẽ bị dồn về đầu khung kế tiếp. Không muốn: tắt work hours (set 0/0) trong settings |
| Cron im lặng | Check `remind_at <= now()`, `status='pending'`, và backend đang chạy (không bị scale-to-zero ở prod) |

---

## 6. Build / typecheck / lint

### `Cannot find module '@smartschedule/shared'`
- Chưa `pnpm install` ở root (workspace cần resolve symlink).
- `rm -rf node_modules **/node_modules && pnpm install`.

### Backend build TS lỗi sau khi sửa entity
- TypeORM strict — kiểm dấu `!` trên field non-null definite assignment.
- Chạy `pnpm --filter smartschedule-backend build` xem stack trace.

### Web build báo "Module not found: shared"
- Same as trên — workspace symlink. Restart Next.js dev server sau `pnpm install`.

### Mobile build EAS báo lỗi `EXPO_PUBLIC_API_URL` undefined
- EAS build profile cần env var explicit (`eas.json` hoặc EAS dashboard).
- Local `.env` không tự được upload sang build cloud.

---

## 7. Deploy environment

### Railway / Fly / Render

| Triệu chứng | Fix |
|---|---|
| Service crash boot | Xem deploy logs. 90% là DB connection (xem §3) hoặc thiếu `JWT_SECRET` |
| 502 Bad Gateway | Service đã start nhưng listen sai port. Đảm bảo dùng `PORT` env var (Railway/Render auto-inject), code đọc `process.env.PORT ?? '3000'` ✓ |
| Cron không chạy trong production | Service bị scale-to-zero khi idle. Free tier nhiều provider đều như vậy. Workaround: keep-alive ping mỗi 5 phút bằng UptimeRobot |
| Custom domain báo SSL chưa cấp | Lỗi DNS. Đảm bảo CNAME đúng, đợi 5-15 phút Let's Encrypt |
| Đổi `JWT_SECRET` → tất cả user logout | **Đúng** — đó là cơ chế. Tránh đổi trừ khi khẩn cấp (rotate sau leak) |
| `EXPO_ACCESS_TOKEN` không hoạt động | Token revoke ở Expo console. Tạo lại. |

### Vercel (web)

| Triệu chứng | Fix |
|---|---|
| Build fail "Cannot find module" | Vercel Build Settings → Root Directory phải là `web`. Vercel auto-detect không phải lúc nào cũng đúng cho monorepo |
| API call fail trên prod | `NEXT_PUBLIC_API_URL` chưa set hoặc trỏ `localhost`. Vercel project → Environment Variables. |
| Preview branch khác config với production | Vercel cho phép set var per-environment (Production / Preview / Development). Kiểm scope đã đúng |

---

## 8. Health check

Nếu không chắc backend có chạy / DB có kết nối được:

```bash
curl http://localhost:3000/api/health
# {"status":"ok","db":"up","uptime_seconds":12.3,"timestamp":"2026-..."}
```

- `db: "down"` → đi tiếp §3 (DB).
- HTTP timeout / connection refused → backend không chạy, xem §1 hoặc §7 (deploy).

Production (Railway/Fly): set health check của platform trỏ `/api/health` để tự restart khi unhealthy.

## 9. Khi không biết lỗi từ đâu

Quy trình debug:
1. **Reproduce nhỏ nhất**: gói lại câu lệnh / action gây lỗi.
2. **Đọc log đầu tiên**:
   - Backend: `docker compose logs -f backend` hoặc Railway Deploy Logs.
   - Web: browser console + Network tab.
   - Mobile: Metro terminal + Expo Go shake → "Debug Remote JS".
3. **Tách layer**: gọi thẳng API bằng `curl` (bỏ qua client) — nếu OK thì lỗi ở client.
4. **DB**: query thẳng bằng `psql "$DATABASE_URL"` để loại trừ ORM.
5. **Env**: in ra `process.env` (chỉ trong dev) để check var có được load đúng không.
6. Nếu đã thử >30 phút mà tắc → mở Issue GitHub kèm log + bước reproduce, đừng ngại hỏi nhóm.
