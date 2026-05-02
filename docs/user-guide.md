# Hướng dẫn người dùng

Tài liệu cho **người dùng cuối** SmartSchedule. Có 2 client:

- **Web** (Next.js): truy cập qua trình duyệt.
- **Mobile** (Expo / React Native): cài qua Expo Go khi dev, hoặc APK/IPA khi build production.

> **Lưu ý đồng bộ**: tính năng giữa 2 nền tảng chưa hoàn toàn ngang nhau — bảng "Tính năng có sẵn" cuối tài liệu liệt kê chính xác cái nào ở đâu.

---

## 1. Đăng ký & đăng nhập

### Đăng ký
1. Mở app/web → màn hình **Đăng nhập** → bấm **"Đăng ký miễn phí"**.
2. Nhập:
   - **Email** (duy nhất, dùng làm tên đăng nhập)
   - **Mật khẩu** (≥ 6 ký tự)
   - **Tên hiển thị** (tuỳ chọn)
3. Bấm **Đăng ký** → app tự đăng nhập, vào màn hình chính.

### Đăng nhập
1. Email + mật khẩu → **Đăng nhập**.
2. Token JWT lưu trong AsyncStorage (mobile) hoặc localStorage (web). Khi token hết hạn (mặc định **7 ngày**), hệ thống tự đẩy về màn hình đăng nhập.

### Đăng xuất
- **Mobile**: tab **Cài đặt** → **Đăng xuất**.
- **Web**: menu user góc trên (cần kiểm tra UI hiện tại) — hoặc xoá `auth_token` trong localStorage.

---

## 2. Thêm lịch

### Mobile (tab "Thêm")
- **Tiêu đề**: bắt buộc.
- **Mô tả**: tuỳ chọn.
- **Ngày**: gõ `dd/mm/yyyy`, app tự thêm dấu `/` khi gõ. Ví dụ `01052026` → `01/05/2026`.
- **Giờ**: gõ `HH:mm`, app tự thêm dấu `:`. Ví dụ `0900` → `09:00`.
- **Ưu tiên**: 3 nút **Thấp / Vừa / Cao** (chọn 1).
- **Thêm tùy chọn** (toggle để mở):
  - **Kết thúc**: cùng dạng Ngày + Giờ.
  - **Nhắc lúc**: thời điểm muốn được nhắc trước khi lịch bắt đầu.
  - **Loại**: Công việc / Cuộc họp / Sự kiện / Nhắc nhở.
  - **Lặp**: Không lặp / Hằng ngày / Hằng tuần / Hằng tháng.
- Bấm **Lưu lịch**.

### Web (modal "Tạo lịch")
- Tương tự mobile, nhưng:
  - Date / Time là 2 input HTML5 (`type=date` + `type=time`) nên hiển thị format theo locale trình duyệt.
  - Nâng cao (Kết thúc, Nhắc lúc, Loại, Lặp) cũng ẩn sau toggle "Tùy chọn nâng cao".
- Bấm **Lưu**.

### Validation
- Tiêu đề trống → app báo "Thiếu thông tin".
- Ngày/giờ không hợp lệ (vd `31/02/2026`, `99:99`) → app báo "Thời gian không hợp lệ", không gửi lên server.
- Server backend tự reject nếu thiếu trường bắt buộc — xem `backend/src/schedules/dto/`.

---

## 3. Xem lịch

| Màn hình | Mô tả | Web | Mobile |
|---|---|---|---|
| **Hôm nay** | Lịch trong ngày hiện tại | ✓ `/today` | ✓ tab "Hôm nay" |
| **Sắp tới** | Lịch trong 7 ngày tới (cần kiểm tra range) | ✓ `/upcoming` | ✓ tab "Sắp tới" |
| **Quá hạn** | Lịch đã qua mà chưa hoàn thành | ✓ `/overdue` | ✗ |
| **Lịch tháng** (calendar view) | Hiển thị dạng FullCalendar | ✓ `/calendar` | ✗ |

### Tương tác trên mỗi lịch
- Bấm vào lịch → xem chi tiết.
- **Hoàn thành**: API `POST /schedules/:id/complete` (cần kiểm tra UI button trên cả 2 client).
- **Sửa**: `PATCH /schedules/:id`.
- **Xoá**: `DELETE /schedules/:id`.

---

## 4. Tìm kiếm

- **Web**: trang `/search` — gõ keyword, kết quả là các lịch khớp tiêu đề/mô tả (cần kiểm tra logic chính xác — server endpoint `GET /schedules/search?q=…`).
- **Mobile**: tab "Tìm" — tương tự.

---

## 5. Tag (chỉ web)

- **Web**: trang `/tags`. Tạo tag (tên + màu), gán/gỡ tag khỏi lịch, lọc lịch theo tag.
- **Mobile**: ✗ chưa có UI. Endpoint backend đã có (`GET/POST/DELETE /tags`, `POST /schedules/:id/tags`, `GET /schedules-by-tag/:name`) — **đề xuất bổ sung UI mobile**.

---

## 6. Template (chỉ web)

- **Web**: trang `/templates`. Tạo template (tên + tiêu đề mặc định + duration + remind + priority), instantiate thành 1 lịch mới chỉ với 1 click.
- **Mobile**: ✗ chưa có UI. Endpoint backend đã có (`GET/POST /templates`, `POST /templates/:name/instantiate`) — **đề xuất bổ sung UI mobile**.

Use case: ghi nhớ kịch bản hay lặp lại như "Họp scrum 9h sáng 30 phút" → instantiate nhanh.

---

## 7. Chia sẻ lịch

- Backend đã có endpoint:
  - `POST /schedules/:id/shares` — chia sẻ 1 lịch cho user khác (theo email/userId — cần kiểm tra DTO).
  - `DELETE /schedules/:id/shares/:targetId` — gỡ chia sẻ.
  - `GET /schedules/:id/shares` — list user đang được chia sẻ.
  - `GET /shared-with-me` — list lịch người khác chia sẻ cho mình.
- **UI**: ✗ web + mobile đều chưa có. **Đề xuất bổ sung** trên cả 2 client.

---

## 8. Cài đặt

### Mobile (tab "Cài đặt")
Hiện có:
- Avatar + tên + email user.
- Toggle giao diện sáng/tối (`ThemeToggle`).
- Nút **Đăng xuất**.

**Đề xuất bổ sung** (backend đã hỗ trợ qua `GET/PATCH /users/me/settings`):
- Timezone
- Số phút nhắc mặc định
- Bật/tắt nhận push
- Khung giờ làm việc (work_start_hour, work_end_hour)

### Web
Trang `/settings` — cần kiểm tra UI hiện tại có những gì.

---

## 9. Tính năng có sẵn — bảng đối chiếu

| Tính năng | Backend | Web | Mobile |
|---|:---:|:---:|:---:|
| Đăng ký / đăng nhập | ✓ | ✓ | ✓ |
| Thêm / sửa / xoá lịch | ✓ | ✓ | ✓ (form UX cải tiến) |
| Hôm nay / Sắp tới | ✓ | ✓ | ✓ |
| Quá hạn | ✓ | ✓ | ✗ |
| Calendar view | ✓ | ✓ | ✗ |
| Tìm kiếm | ✓ | ✓ | ✓ |
| Tag | ✓ | ✓ | ✗ |
| Template | ✓ | ✓ | ✗ |
| Chia sẻ lịch | ✓ | ✗ | ✗ |
| Audit log | ✓ | cần kiểm tra | cần kiểm tra |
| Push notification (cron + Expo) | ✓ | — | đã có service nhưng **chưa được gọi** (xem [`notifications.md`](./notifications.md)) |
| Recurrence (lặp daily/weekly/monthly) | có cột DB + DTO, **logic sinh occurrences cần kiểm tra** | tạo được | tạo được |

---

## 10. Liên hệ / báo lỗi

- Báo bug / đề xuất tính năng: GitHub Issues của repo.
- Nếu là sinh viên trong nhóm dev: trao đổi trên kênh nhóm + tag PR/Issue.
