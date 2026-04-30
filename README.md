# SmartSchedule

Ứng dụng quản lý lịch trình & nhắc nhở thông minh.

- **Backend**: NestJS + TypeORM + PostgreSQL + JWT + Expo Push Notifications
- **Mobile**: React Native (Expo) + TypeScript + React Navigation + Zustand
- **Deploy**: Docker + docker-compose, CI bằng GitHub Actions

> Tài liệu đầy đủ về kiến trúc, tính năng, API và quy trình deploy: [`PROJECT.md`](./PROJECT.md)

---

## Cấu trúc monorepo

```
SmartSchedule/
├── backend/                 # NestJS REST API
│   ├── src/
│   ├── migrations/
│   ├── test/
│   ├── Dockerfile
│   └── package.json
├── mobile/                  # Expo (React Native)
│   ├── app/                 # Expo Router screens
│   ├── components/
│   ├── services/            # API client
│   ├── hooks/
│   └── package.json
├── docker-compose.yml
├── .env.example
├── .github/workflows/ci.yml
├── README.md
└── PROJECT.md               # Tài liệu chi tiết
```

---

## Khởi động nhanh

### 1. Clone & cấu hình

```bash
git clone https://github.com/ChayNhu04/SmartSchedule.git
cd SmartSchedule
cp .env.example .env
# chỉnh JWT_SECRET, DATABASE_URL nếu cần
```

### 2. Backend (Docker)

```bash
docker compose up -d --build
docker compose logs -f backend
# API: http://localhost:3000/api
# Swagger: http://localhost:3000/api/docs
```

### 2b. Backend (chạy local không Docker)

```bash
cd backend
npm install
# Đảm bảo có PostgreSQL chạy ở DATABASE_URL
npm run start:dev
```

### 3. Mobile (Expo)

```bash
cd mobile
npm install
cp .env.example .env  # set EXPO_PUBLIC_API_URL=http://<IP-máy-bạn>:3000/api
npx expo start
```

Dùng Expo Go app trên điện thoại quét QR, hoặc chạy emulator Android/iOS.

---

## Lệnh thường dùng

### Backend

```bash
npm run start:dev      # watch mode
npm run build          # compile TypeScript
npm run start:prod     # chạy bản build
npm run lint
npm test
npm run migration:run  # chạy migrations
```

### Mobile

```bash
npx expo start         # dev server
npx expo start --tunnel
eas build -p android   # production build (cần tài khoản Expo)
eas build -p ios
```

---

## Tính năng chính (tóm tắt)

- 🔐 Đăng ký / đăng nhập (JWT)
- 📅 CRUD lịch (task / meeting / event / reminder)
- 🟢🟡🔴 Mức ưu tiên (low / normal / high)
- 🔁 Lịch lặp (daily / weekly / monthly + interval + until)
- 🏷️ Tag/nhãn (many-to-many)
- 📋 Template lịch
- 👥 Chia sẻ lịch (view-only)
- 🔔 Nhắc nhở tự động (cron mỗi phút) + push notification qua Expo
- ⏰ Khung giờ làm việc — reminder ngoài khung dồn về sáng hôm sau
- 📥 Import Excel + iCalendar (.ics)
- 📤 Export iCalendar
- 🔍 Tìm kiếm + thống kê (completion rate, hot hours, breakdown theo loại / ưu tiên)
- ↩️ Undo thao tác xoá / hoàn-thành (≤10 phút)
- 📜 Audit log

Chi tiết từng tính năng + API endpoint xem [`PROJECT.md`](./PROJECT.md).

---

## License

MIT — xem [`LICENSE`](./LICENSE) (sẽ thêm sau).
