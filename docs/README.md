# Tài liệu SmartSchedule

Thư mục này chứa các tài liệu chi tiết cho dự án. Phần tổng quan + kiến trúc cấp cao đã có ở [`../README.md`](../README.md) và [`../PROJECT.md`](../PROJECT.md) (tài liệu kiến trúc đầy đủ ~700 dòng); các file ở đây bóc tách thành chủ đề nhỏ, dễ đọc cho người mới.

## Mục lục

| File | Đối tượng | Nội dung tóm tắt |
|---|---|---|
| [`user-guide.md`](./user-guide.md) | Người dùng cuối | Hướng dẫn dùng app: đăng ký, đăng nhập, thêm/xem/tìm lịch, tag, template, chia sẻ, cài đặt. Có ghi rõ tính năng nào đã có trên web/mobile, tính năng nào chưa. |
| [`developer-setup.md`](./developer-setup.md) | Dev mới vào dự án | Cài đặt local: pnpm, env, Postgres (Docker hoặc Neon), chạy backend / web / mobile, lệnh test, smoke test. |
| [`architecture.md`](./architecture.md) | Dev | Sơ đồ kiến trúc 4 package (`backend` / `web` / `mobile` / `shared`), data flow, auth flow (JWT), schedule + reminder flow. |
| [`notifications.md`](./notifications.md) | Dev | Push notification: Expo token, backend lưu, cron 1 phút quét `remind_at`, cách test, lỗi thường gặp. **Đặc biệt: ghi rõ phần nào đã wire xong và phần nào còn thiếu.** |
| [`troubleshooting.md`](./troubleshooting.md) | Dev khi gặp lỗi | Lỗi hay gặp: API URL mobile, CORS browser, DB SSL/connect, JWT mismatch, Expo notification, deploy env vars. |
| [`deployment-railway.md`](./deployment-railway.md) | Dev / DevOps | Runbook deploy backend Railway + Neon Postgres. |

## Quy ước viết

- Tiếng Việt, code/lệnh giữ tiếng Anh.
- Khi tham chiếu file/dòng cụ thể, dùng đường dẫn tương đối từ root repo (vd `backend/src/main.ts`).
- Tính năng đã có trong code → mô tả thẳng. Tính năng chưa có hoặc chưa chắc chạy → ghi rõ "**cần kiểm tra**" hoặc "**đề xuất bổ sung**".
- Câu lệnh shell viết trong block ```bash …``` để copy-paste được luôn.

## Khi nào cập nhật doc

- Thêm endpoint API mới → cập nhật `architecture.md` mục REST API + `user-guide.md` nếu user thấy được.
- Thêm env var → cập nhật `developer-setup.md` + `troubleshooting.md`.
- Thay đổi flow đăng nhập / push → `architecture.md` + `notifications.md`.
- Đổi nhà cung cấp deploy → `deployment-railway.md` (hoặc tạo file mới `deployment-<provider>.md`).

> Doc cấp cao về business + design ở [`../DESIGN.md`](../DESIGN.md) (~1500 dòng). Không trùng nội dung với các file trong thư mục này.
