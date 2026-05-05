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
- **Web**: nút **Đăng xuất** ở cuối sidebar (hoặc xoá `auth_token` trong localStorage).

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

### Thêm nhanh (natural language)
Trên màn **Hôm nay** (web + mobile) và **Sắp tới** (web) có một ô "Thêm nhanh" ở đầu danh sách. Bạn gõ một câu tiếng Việt và app sẽ tự parse ra tiêu đề + thời gian.

Ví dụ hợp lệ:
- `mai 9h họp scrum`
- `tối nay học bài`
- `15/5 14h chiều cafe với Linh`
- `mốt 8h Review sprint`
- `9h ăn sáng` (nếu hiện tại đã quá 9h thì sẽ tự bump sang 9h sáng mai)

Hỗ trợ:
- **Ngày tương đối**: `hôm nay` / `nay`, `mai` / `ngày mai`, `kia` / `mốt`.
- **Ngày tuyệt đối**: `dd/mm` hoặc `dd/mm/yyyy` (vd `15/5`, `15/05/2027`).
- **Giờ**: `9h`, `9h30`, `9:30`, `9 giờ`, `9 giờ 30`.
- **Buổi**: `sáng` (mặc định 9h), `trưa` (12h), `chiều` (14h, cộng 12 nếu giờ ≤ 12), `tối` (19h, cộng 12 nếu giờ ≤ 12), `đêm` (22h).

Phần còn lại của câu trở thành **tiêu đề**. App hiển thị preview "Sẽ tạo: …" để bạn xác nhận trước khi bấm Enter / nút Thêm. Mặc định lịch tạo ra có loại "Công việc", ưu tiên "Vừa", thời lượng 60 phút — sửa thêm chi tiết bằng cách bấm vào card sau khi tạo.

---

## 3. Xem lịch

| Màn hình | Mô tả | Web | Mobile |
|---|---|---|---|
| **Hôm nay** | Lịch trong ngày hiện tại | ✓ `/today` | ✓ tab "Hôm nay" |
| **Sắp tới** | Lịch trong 7 ngày tới | ✓ `/upcoming` | ✓ tab "Sắp tới" |
| **Quá hạn** | Lịch đã qua mà chưa hoàn thành | ✓ `/overdue` | ✓ banner ở "Hôm nay" + screen `/overdue` |
| **Lịch tháng** (calendar view) | Hiển thị dạng FullCalendar | ✓ `/calendar` | ✗ chưa có |
| **Thống kê** | Số liệu + biểu đồ + xuất `.ics` | ✓ `/stats` | ✓ Cài đặt → Quản lý → Thống kê |

### Tương tác trên mỗi lịch

**Web** (trang Hôm nay / Sắp tới / Quá hạn / Calendar):
- 3 nút icon ở góc phải mỗi card: ✓ **Hoàn thành** (`POST /schedules/:id/complete`), ✏️ **Sửa** (mở dialog), 🗑 **Xoá** (mở `ConfirmDialog`).
- Sau khi xoá / hoàn thành, **toast Sonner** có nút **"Hoàn tác"** (8 giây) — bấm để khôi phục (`POST /schedules/undo`). Cửa sổ hoàn tác hiệu lực **10 phút** kể từ thao tác.

**Mobile**:
- Bấm vào card lịch → mở **màn hình Chi tiết** (`/schedule/:id`):
  - Hiển thị thời gian bắt đầu/kết thúc, nhắc lúc, loại, lặp, mô tả.
  - Nút **Đánh dấu hoàn thành** (chỉ hiện khi status = pending).
  - Nút **Sửa** → mở màn hình Sửa với form đã điền sẵn (component `ScheduleForm` mode `edit`).
  - Nút **Xoá** → bật `Alert` xác nhận → `DELETE /schedules/:id` → `Alert` thứ hai có nút **"Hoàn tác"** + **"OK"**.
  - Sau khi đánh dấu hoàn thành, `Alert` cũng có nút **"Hoàn tác"** + **"OK"**.

---

## 4. Tìm kiếm

- **Web**: trang `/search` — gõ keyword, kết quả là các lịch khớp tiêu đề **hoặc** mô tả (`ILIKE %keyword%`, max 50 kết quả gần nhất). Endpoint `GET /schedules/search?q=…`.
- **Mobile**: tab "Tìm" — tương tự.

---

## 5. Tag

- **Web**: trang `/tags`. Tạo tag (tên + màu), gán/gỡ tag khỏi lịch, lọc lịch theo tag.
- **Mobile**: Cài đặt → Quản lý → **Nhãn**. Tạo / xoá tag. Tag hiển thị dạng chip trên schedule card. Trang **Sắp tới** có hàng chip filter theo tag (gọi `/schedules?tag_id=N`).

Backend endpoint: `GET/POST/DELETE /tags`, `POST /schedules/:id/tags`, `GET /schedules-by-tag/:name`.

---

## 6. Mẫu lịch (Template)

- **Web**: trang `/templates`. Tạo mẫu (tên + tiêu đề + duration + remind + priority) → "Tạo lịch" để nhân bản nhanh thành lịch mới. Có 4 preset gợi ý cho user mới (Họp tuần, Sprint review, Uống thuốc, Gym).
- **Mobile**: Settings → Quản lý → "Mẫu lịch". Cùng tính năng (tạo, xoá, instantiate, preset). Modal date/time để chọn thời gian khi tạo lịch từ mẫu.

Use case: ghi nhớ kịch bản hay lặp lại như "Họp scrum 9h sáng 30 phút" → instantiate nhanh.

---

## 7. Chia sẻ lịch

- **Web**:
  - Trên mỗi schedule card: nút icon **Share** → mở dialog tìm user theo email → "Chia sẻ" → người kia thấy lịch ở mục "Chia sẻ với tôi".
  - Sidebar: **Chia sẻ với tôi** (`/shared`) — list lịch người khác chia sẻ cho mình. Read-only (không sửa/xoá), có badge "Từ <tên người chia sẻ>".
  - Dialog có thể gỡ share đã có.
- **Mobile**:
  - Trên màn Chi tiết lịch: nút **Chia sẻ** → mở `/schedule/:id/share` (tìm theo email + danh sách user đang nhận).
  - Trang **"Chia sẻ với tôi"** mở từ Cài đặt → Quản lý → "Chia sẻ với tôi" (`/shared`).

Backend endpoint:
- `POST /schedules/:id/shares` — body `{ target_user_id }`.
- `DELETE /schedules/:id/shares/:targetId` — gỡ.
- `GET /schedules/:id/shares` — list user đang nhận share.
- `GET /shared-with-me` — list lịch người khác chia sẻ cho user hiện tại.
- `GET /users/lookup?email=` — tìm user theo email (chỉ trả id + email + display_name).

---

## 8. Cài đặt

### Mobile (tab "Cài đặt")
- Avatar + tên + email user.
- Toggle giao diện **sáng / tối**.
- Toggle **Nhận thông báo đẩy** (cập nhật `notify_via_push`).
- **Múi giờ** (default `Asia/Ho_Chi_Minh`).
- **Khung giờ làm việc** — `work_start_hour` / `work_end_hour`. Reminder rơi ngoài khung sẽ được dồn về đầu khung kế tiếp.
- **Số phút nhắc mặc định** (`default_remind_minutes`).
- Card "Quản lý" — link sang Nhãn / Mẫu lịch / Chia sẻ với tôi / Quá hạn / Thống kê.
- Nút **Đăng xuất**.

### Web (trang `/settings`)
- Toggle theme sáng / tối (cũng có ở sidebar).
- Toggle nhận push notification (chú ý: web không nhận push, đây chỉ là master toggle dùng chung cho tất cả device đăng nhập cùng tài khoản).
- Múi giờ.
- Khung giờ làm việc + validate `end > start`. Mặc định 8/17.
- Số phút nhắc mặc định.
- Tài khoản — đổi tên hiển thị, đăng xuất.

---

## 9. Tính năng có sẵn — bảng đối chiếu

| Tính năng | Backend | Web | Mobile |
|---|:---:|:---:|:---:|
| Đăng ký / đăng nhập | ✓ | ✓ | ✓ |
| Thêm lịch (form đầy đủ) | ✓ | ✓ | ✓ |
| **Thêm nhanh** (NLP tiếng Việt) | ✓ (parser ở `shared`) | ✓ (Hôm nay / Sắp tới) | ✓ (Hôm nay) |
| Xem chi tiết / Sửa / Xoá lịch | ✓ | ✓ (icon trên card) | ✓ (`/schedule/:id`) |
| Đánh dấu hoàn thành | ✓ | ✓ | ✓ |
| **Hoàn tác xoá / hoàn-thành (10 phút)** | ✓ (`POST /schedules/undo`) | ✓ (Sonner toast) | ✓ (Alert) |
| Hôm nay / Sắp tới | ✓ | ✓ | ✓ |
| Quá hạn | ✓ | ✓ `/overdue` | ✓ (banner ở Hôm nay + screen `/overdue`) |
| Calendar tháng | ✓ | ✓ FullCalendar tiếng Việt | ✗ chưa có |
| Tìm kiếm | ✓ | ✓ `/search` | ✓ tab "Tìm" |
| **Thống kê** + bar chart | ✓ (`/schedules/stats`) | ✓ `/stats` (CSS bar) | ✓ `/stats` (RN View bar) |
| **Xuất iCalendar `.ics`** | ✓ (`/schedules/export.ics`) | ✓ nút trong `/stats` (download) | ✓ Cài đặt → Quản lý → Thống kê (share sheet) |
| Tag (CRUD + filter) | ✓ | ✓ `/tags` | ✓ `/tags` + filter chip ở Sắp tới |
| Mẫu lịch (CRUD + 4 preset) | ✓ | ✓ `/templates` | ✓ `/templates` |
| Chia sẻ lịch | ✓ | ✓ (dialog + `/shared`) | ✓ (`/schedule/:id/share` + `/shared`) |
| Audit log | ✓ (`/audit`) | ✗ chưa expose UI | ✗ chưa expose UI |
| Push notification (cron + Expo) | ✓ (cron + work-hours shift) | — (browser không nhận push) | ✓ wired ở `(tabs)/_layout.tsx` |
| Recurrence (daily/weekly/monthly + interval + until) | ✓ (cột DB + DTO; logic sinh occurrences chưa code, lịch lặp hiện chỉ lưu 1 row gốc) | ✓ form chọn được | ✓ form chọn được |
| Health check (`/health`) | ✓ | — | — |

---

## 10. Liên hệ / báo lỗi

- Báo bug / đề xuất tính năng: GitHub Issues của repo.
- Nếu là sinh viên trong nhóm dev: trao đổi trên kênh nhóm + tag PR/Issue.
