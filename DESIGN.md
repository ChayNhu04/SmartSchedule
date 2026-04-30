# SmartSchedule — Design System

> Tài liệu design hệ thống cho **web** (Next.js + Tailwind + shadcn/ui) và **mobile** (React Native + Expo). Mục tiêu: app đẹp, hiện đại, tử tế trong từng pixel — không "scaffold xong là xong".

---

## 0. Tổng quan & nguyên tắc

### Triết lý

1. **Minimal nhưng có chiều sâu** — neutral background, accent màu rõ ràng, dùng shadow/blur có chủ đích chứ không loè loẹt.
2. **Lấy nội dung làm trung tâm** — schedule card phải đọc thoáng, không bị viền/màu chen chúc làm phân tán.
3. **Hierarchy rõ ràng** — title to + đậm, meta nhỏ + nhạt, action chính nổi bật, action phụ chìm.
4. **Phản hồi tức thì** — mọi click, hover, focus đều có animation < 200ms.
5. **Nhất quán giữa web & mobile** — cùng tone màu, cùng icon set, cùng wording. User đổi platform vẫn quen.
6. **Accessible by default** — contrast ≥ 4.5:1, focus ring rõ, hỗ trợ reduce motion, navigate được bằng keyboard.

### Inspiration

- [Linear](https://linear.app) — typography, micro-interactions, command palette
- [Notion Calendar](https://calendar.notion.so) — calendar view layout
- [Vercel Dashboard](https://vercel.com/dashboard) — sidebar, card density, empty state
- [Things 3](https://culturedcode.com/things/) — mobile schedule list, swipe action
- [Cron / Notion](https://www.notion.so/calendar) — event detail bottom sheet

### Mood board (giữ trong đầu khi code)

```
┌─────────────────────────────────────────────────┐
│  Trung tính         Trắng / Xám rất nhạt        │
│  Accent             Xanh #2563EB (indigo-blue)  │
│  Priority cao        Đỏ #EF4444 (subtle)        │
│  Priority vừa        Vàng amber #F59E0B         │
│  Priority thấp       Xanh lá #10B981            │
│  Typography         Inter (web), SF/Roboto (mobile)
│  Border radius      12-16px (mềm, không vuông)  │
│  Shadow             0 1px 3px rgba(0,0,0,0.06)  │
│  Animation          200-250ms cubic-bezier      │
└─────────────────────────────────────────────────┘
```

---

## 1. Design tokens

### 1.1 Color palette

Dùng **CSS variables** (HSL) cho web (đã setup trong shadcn/ui), tương đương `Theme.colors` cho mobile.

#### Light mode

| Token              | HSL value          | Hex       | Dùng cho                          |
|--------------------|--------------------|-----------|------------------------------------|
| `--background`     | `0 0% 100%`        | `#FFFFFF` | Background chính                   |
| `--foreground`     | `222 47% 11%`      | `#0F172A` | Text chính                         |
| `--muted`          | `210 40% 96%`      | `#F1F5F9` | Card/section nhạt                  |
| `--muted-foreground` | `215 16% 47%`    | `#64748B` | Text phụ (meta, description)       |
| `--card`           | `0 0% 100%`        | `#FFFFFF` | Card background                    |
| `--card-foreground`| `222 47% 11%`      | `#0F172A` | Text trong card                    |
| `--border`         | `214 32% 91%`      | `#E2E8F0` | Border subtle                      |
| `--input`          | `214 32% 91%`      | `#E2E8F0` | Border của input                   |
| `--ring`           | `221 83% 53%`      | `#2563EB` | Focus ring                         |
| `--primary`        | `221 83% 53%`      | `#2563EB` | Button chính, link, active state   |
| `--primary-foreground` | `210 40% 98%`  | `#F8FAFC` | Text trên primary                  |
| `--secondary`      | `210 40% 96%`      | `#F1F5F9` | Button phụ                         |
| `--secondary-foreground` | `222 47% 11%`| `#0F172A` | Text trên secondary                |
| `--accent`         | `210 40% 96%`      | `#F1F5F9` | Hover state                        |
| `--destructive`    | `0 84% 60%`        | `#EF4444` | Xóa, lỗi nghiêm trọng              |
| `--success`        | `142 76% 36%`      | `#16A34A` | Hoàn thành, thành công             |
| `--warning`        | `38 92% 50%`       | `#F59E0B` | Cảnh báo, priority vừa             |

#### Dark mode

| Token              | HSL value         | Hex       |
|--------------------|-------------------|-----------|
| `--background`     | `222 47% 8%`      | `#0B1220` |
| `--foreground`     | `210 40% 98%`     | `#F8FAFC` |
| `--muted`          | `217 33% 17%`     | `#1E293B` |
| `--muted-foreground` | `215 20% 65%`   | `#94A3B8` |
| `--card`           | `222 47% 11%`     | `#0F172A` |
| `--border`         | `217 33% 17%`     | `#1E293B` |
| `--primary`        | `217 91% 60%`     | `#3B82F6` |
| ...                | ...               | ...       |

#### Priority colors (semantic)

```ts
export const PRIORITY_COLOR = {
  low:    { bg: '#DCFCE7', fg: '#166534', dot: '#22C55E' }, // xanh
  normal: { bg: '#FEF3C7', fg: '#92400E', dot: '#F59E0B' }, // vàng
  high:   { bg: '#FEE2E2', fg: '#991B1B', dot: '#EF4444' }, // đỏ
};

// Dark mode variants
export const PRIORITY_COLOR_DARK = {
  low:    { bg: 'rgba(34,197,94,0.15)',  fg: '#86EFAC', dot: '#22C55E' },
  normal: { bg: 'rgba(245,158,11,0.15)', fg: '#FCD34D', dot: '#F59E0B' },
  high:   { bg: 'rgba(239,68,68,0.15)',  fg: '#FCA5A5', dot: '#EF4444' },
};
```

> Dùng làm **badge background**, **calendar event color**, **left border của schedule card**.

### 1.2 Typography

**Font stack**:

```css
/* web */
font-family: "Inter Variable", "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
```

```ts
// mobile
fontFamily: Platform.select({
  ios: 'SF Pro Text',
  android: 'Roboto',
  default: 'System',
});
```

**Scale** (cùng cho web & mobile, đơn vị mobile dùng số raw cho RN):

| Token       | Size  | Line height | Weight | Dùng cho                          |
|-------------|-------|-------------|--------|------------------------------------|
| `text-xs`   | 12px  | 16px        | 500    | Caption, meta, badge text          |
| `text-sm`   | 14px  | 20px        | 500    | Body nhỏ, button, input            |
| `text-base` | 16px  | 24px        | 400    | Body chuẩn                         |
| `text-lg`   | 18px  | 28px        | 600    | Card title                         |
| `text-xl`   | 20px  | 28px        | 600    | Section title                      |
| `text-2xl`  | 24px  | 32px        | 700    | Page title                         |
| `text-3xl`  | 30px  | 36px        | 700    | Hero / landing                     |

**Font weight**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold). **Không dùng 800/900** — quá đậm với UI app.

**Line clamp** cho schedule title dài: 2 lines, `…` cuối. Description: 1 line.

### 1.3 Spacing scale

Áp dụng đồng đều — đừng dùng số lẻ kiểu `13px`, `27px`.

```
0   = 0
1   = 4px
2   = 8px
3   = 12px
4   = 16px
5   = 20px
6   = 24px
8   = 32px
10  = 40px
12  = 48px
16  = 64px
```

**Quy ước**:
- Padding card: `p-4` (16px) hoặc `p-6` (24px) cho card lớn
- Gap giữa schedule cards: `gap-3` (12px)
- Section margin: `mb-8` (32px)
- Inline icon-text gap: `gap-2` (8px)

### 1.4 Border radius

| Token         | Value | Dùng cho                         |
|---------------|-------|-----------------------------------|
| `rounded-sm`  | 4px   | Badge, chip                       |
| `rounded`     | 8px   | Input, small button               |
| `rounded-md`  | 10px  | Button (default)                  |
| `rounded-lg`  | 12px  | Card                              |
| `rounded-xl`  | 16px  | Modal, large card, sidebar item   |
| `rounded-2xl` | 20px  | Hero card, FAB                    |
| `rounded-full`| 9999  | Avatar, dot, FAB icon             |

**Quy tắc**: card luôn `rounded-xl` (16px), button luôn `rounded-md` (10px). Đừng mix `rounded-lg` với `rounded-xl` cùng 1 view.

### 1.5 Shadow / elevation

```css
/* Subtle (default cho card) */
--shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.04);

/* Card hover */
--shadow-md: 0 4px 12px -2px rgba(0,0,0,0.06), 0 2px 4px -1px rgba(0,0,0,0.04);

/* Modal / dialog */
--shadow-lg: 0 20px 40px -12px rgba(0,0,0,0.15), 0 8px 16px -4px rgba(0,0,0,0.08);

/* Bottom sheet (mobile) */
--shadow-bottom: 0 -8px 24px rgba(0,0,0,0.10);
```

> Dark mode: thay `rgba(0,0,0,X)` thành `rgba(0,0,0, X*2)` để shadow vẫn nhìn được.

### 1.6 Motion / animation

| Loại                 | Duration | Easing                    |
|----------------------|----------|---------------------------|
| Hover (color/bg)     | 150ms    | `ease-out`                |
| Click feedback       | 100ms    | `ease-out`                |
| Modal enter          | 250ms    | `cubic-bezier(0.16,1,0.3,1)` |
| Modal exit           | 200ms    | `ease-in`                 |
| Page transition      | 200ms    | `ease-in-out`             |
| Sidebar collapse     | 250ms    | `cubic-bezier(0.16,1,0.3,1)` |
| Toast slide-in       | 300ms    | spring                    |
| Skeleton shimmer     | 1500ms   | `linear` infinite         |

**Tôn trọng `prefers-reduced-motion`** — chỉ giữ fade, bỏ slide/scale.

### 1.7 Icon set

- **Web**: `lucide-react` — đã cài sẵn. Dùng size `16` (inline trong text) hoặc `20` (button), `24` (sidebar).
- **Mobile**: `@expo/vector-icons` (Feather) — gần Lucide nhất.

Nguyên tắc:
- Stroke 2px (mặc định)
- Không dùng emoji thay icon trừ priority flag (🟢🟡🔴) — và dùng dot SVG đẹp hơn.
- Không dùng cả 2 set icon trong 1 màn hình.

---

## 2. Component patterns

### 2.1 Schedule Card (component quan trọng nhất)

**Anatomy**:
```
┌────────────────────────────────────────────────────┐
│ ▌  ⏰ 09:00 — 10:30 · Hôm nay        🔴 Cao  ›   │  ← header row
│ ▌                                                 │
│ ▌  Họp review sprint 23                           │  ← title (lg, 600)
│ ▌  Thảo luận progress + planning sprint 24       │  ← description (sm, muted)
│ ▌                                                 │
│ ▌  📌 work   📌 sprint                  3 người   │  ← tags + share count
└────────────────────────────────────────────────────┘
   ↑
   Left border 4px theo priority color
```

**Web (Tailwind)**:
```tsx
<Card className="
  group relative overflow-hidden
  rounded-xl border border-border
  bg-card hover:bg-accent/50
  transition-all duration-200
  hover:shadow-md hover:-translate-y-0.5
  cursor-pointer
">
  {/* Left priority bar */}
  <div className={cn(
    "absolute left-0 top-0 bottom-0 w-1",
    PRIORITY_BAR_CLASS[schedule.priority]
  )} />

  <CardContent className="p-4 pl-5">
    {/* Time + priority */}
    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
      <span className="flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" />
        {formatTimeRange(schedule.start_time, schedule.end_time)}
      </span>
      <PriorityBadge priority={schedule.priority} />
    </div>

    {/* Title */}
    <h3 className="text-lg font-semibold leading-snug line-clamp-2 mb-1">
      {schedule.title}
    </h3>

    {/* Description */}
    {schedule.description && (
      <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
        {schedule.description}
      </p>
    )}

    {/* Footer: tags + share */}
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-wrap gap-1">
        {schedule.tags?.slice(0, 3).map((tag) => (
          <TagChip key={tag.id} tag={tag} />
        ))}
      </div>
      {schedule.share_count > 0 && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" /> {schedule.share_count}
        </span>
      )}
    </div>
  </CardContent>

  {/* Status overlay khi completed */}
  {schedule.status === 'completed' && (
    <div className="absolute inset-0 bg-background/40 flex items-center justify-center">
      <Badge variant="success" className="gap-1">
        <Check className="h-3 w-3" /> Đã hoàn thành
      </Badge>
    </div>
  )}
</Card>
```

**Mobile (RN)**:
```tsx
<Pressable
  onPress={onPress}
  android_ripple={{ color: theme.colors.accent }}
  style={({ pressed }) => [
    styles.card,
    pressed && Platform.OS === 'ios' && { opacity: 0.85 },
  ]}
>
  <View style={[styles.priorityBar, { backgroundColor: priorityColor.dot }]} />
  <View style={styles.content}>
    <View style={styles.headerRow}>
      <View style={styles.timeRow}>
        <Feather name="clock" size={12} color={theme.colors.mutedForeground} />
        <Text style={styles.timeText}>{formatTimeRange(...)}</Text>
      </View>
      <PriorityBadge priority={schedule.priority} />
    </View>
    <Text style={styles.title} numberOfLines={2}>{schedule.title}</Text>
    {schedule.description && (
      <Text style={styles.description} numberOfLines={1}>
        {schedule.description}
      </Text>
    )}
    {/* tags + share count */}
  </View>
</Pressable>
```

### 2.2 Button hierarchy

| Variant       | Khi dùng                                  | Style                                    |
|---------------|-------------------------------------------|------------------------------------------|
| `default`     | Action chính (Tạo, Lưu, Đăng nhập)        | `bg-primary text-primary-foreground`     |
| `secondary`   | Action phụ song song (Hủy, Quay lại)      | `bg-secondary text-secondary-foreground` |
| `outline`     | Action phụ ít nổi (Xem chi tiết)          | `border bg-transparent hover:bg-accent`  |
| `ghost`       | Action trong toolbar/sidebar              | `bg-transparent hover:bg-accent`         |
| `destructive` | Xóa, hủy lịch                             | `bg-destructive text-white`              |
| `link`        | Chuyển hướng văn bản                      | `text-primary underline-offset-4 hover:underline` |

**Quy tắc**: 1 dialog/page chỉ có **1 button `default`**. Cancel/secondary luôn ở bên trái, primary bên phải.

```tsx
<DialogFooter>
  <Button variant="ghost" onClick={onCancel}>Hủy</Button>
  <Button onClick={onSubmit}>Lưu lịch</Button>
</DialogFooter>
```

### 2.3 Input / form field

```tsx
<div className="space-y-2">
  <Label htmlFor="title" className="text-sm font-medium">
    Tiêu đề
    <span className="text-destructive ml-0.5">*</span>
  </Label>
  <Input
    id="title"
    placeholder="VD: Họp review sprint"
    className="
      h-10 rounded-md border-input bg-background
      transition-colors
      focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
    "
  />
  {error && (
    <p className="text-xs text-destructive flex items-center gap-1">
      <AlertCircle className="h-3 w-3" /> {error}
    </p>
  )}
</div>
```

**Quy tắc**:
- Label luôn ở trên (không floating, không placeholder-as-label)
- Required marker: dấu `*` đỏ sau label
- Error text dưới input, kèm icon
- Focus ring 2px ring với offset (looks crisp)
- Disabled state: `opacity-50 cursor-not-allowed`

### 2.4 Empty state

Mỗi list page khi không có dữ liệu cần 1 empty state đẹp — đừng để trống hoặc text "No data" khô khan.

```tsx
<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
  <div className="
    w-16 h-16 rounded-2xl bg-muted
    flex items-center justify-center mb-4
  ">
    <CalendarCheck className="w-8 h-8 text-muted-foreground" />
  </div>
  <h3 className="text-lg font-semibold mb-1">Hôm nay không có lịch</h3>
  <p className="text-sm text-muted-foreground max-w-xs mb-6">
    Tận hưởng ngày yên bình, hoặc thêm lịch mới để bắt đầu.
  </p>
  <Button variant="outline" size="sm" className="gap-2">
    <Plus className="w-4 h-4" /> Thêm lịch
  </Button>
</div>
```

**Variants**:
- Hôm nay không có lịch → 🎉 vibe nhẹ nhàng
- Tìm kiếm không có kết quả → 🔍 + suggest "thử từ khóa khác"
- Lỗi → ⚠️ + retry button
- Loading → skeleton (xem 2.5)

### 2.5 Loading / skeleton

Đừng hiện spinner toàn màn hình. Dùng **skeleton card** giữ layout giống thật.

```tsx
function ScheduleCardSkeleton() {
  return (
    <div className="rounded-xl border border-border p-4 pl-5 relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-muted" />
      <div className="flex justify-between items-center mb-2">
        <div className="h-3 w-24 bg-muted rounded animate-pulse" />
        <div className="h-5 w-12 bg-muted rounded-full animate-pulse" />
      </div>
      <div className="h-5 w-3/4 bg-muted rounded animate-pulse mb-2" />
      <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
    </div>
  );
}
```

Hiển thị 3-5 skeleton card khi loading list. **Tuyệt đối không dùng spinner ở giữa màn hình** trừ khi action < 1s.

### 2.6 Toast / notification

- Vị trí: **góc dưới phải** (web), **top** (mobile, slide từ trên xuống)
- Auto dismiss 4s
- Variants: success (xanh icon), error (đỏ icon), info (xanh icon), warning (vàng)
- Có nút undo cho destructive action (vd: xóa lịch)

```tsx
toast.success('Đã tạo lịch', {
  action: {
    label: 'Hoàn tác',
    onClick: () => undoCreate(),
  },
});
```

### 2.7 Badge / chip

```tsx
// Priority
<Badge variant="priority" className={priorityClass(priority)}>
  <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ background: dotColor }} />
  {PRIORITY_LABEL_VI[priority]}
</Badge>

// Tag
<Badge variant="tag" className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
  #{tag.name}
</Badge>

// Status
<Badge variant="success">Hoàn thành</Badge>
<Badge variant="muted">Chờ</Badge>
<Badge variant="destructive">Đã hủy</Badge>
```

Padding: `px-2 py-0.5`. Border radius: `rounded-full` cho priority/status, `rounded-md` cho tag.

---

## 3. Web layout

### 3.1 App shell (sidebar + content)

```
┌──────────┬──────────────────────────────────────────┐
│ Logo  ⌃  │  Page header                  [+ Tạo]  │
│          │  ─────────────────────────────────────   │
│  Hôm nay │                                          │
│  Sắp tới │   Content area                          │
│  Quá hạn │   max-width: 1024px, mx-auto            │
│  Calendar│   px-6 lg:px-8                          │
│  Tìm kiếm│                                          │
│  ────    │                                          │
│  Tags    │                                          │
│  Mẫu     │                                          │
│  Cài đặt │                                          │
│          │                                          │
│  ────    │                                          │
│  user@   │                                          │
│  Đăng x. │                                          │
└──────────┴──────────────────────────────────────────┘
   240px               flex-1
```

**Sidebar**:
- Width: `240px` desktop, `64px` thu gọn (icon-only), full overlay drawer trên mobile (<1024px)
- Background: `bg-card border-r border-border`
- Mỗi nav item: padding `px-3 py-2`, `rounded-lg`, hover `bg-accent`, active `bg-primary/10 text-primary font-medium`
- Logo + thu gọn button ở top, user info + logout ở bottom
- Có separator divider giữa nhóm: Schedule / Manage

**Topbar trong content**:
```
┌──────────────────────────────────────────────────┐
│ Hôm nay                              [+ Tạo lịch]│  ← H1 (text-2xl bold) + primary CTA
│ Toàn bộ lịch trong ngày hôm nay                  │  ← description (text-sm muted)
└──────────────────────────────────────────────────┘
```

Padding: `py-6`. Border bottom subtle.

### 3.2 Auth pages (login / register)

**Layout**: split screen — bên trái form, bên phải gradient/illustration.

```
┌────────────────────────┬──────────────────────────┐
│                        │                          │
│  SmartSchedule (logo)  │     ✨ illustration      │
│                        │                          │
│  Đăng nhập            │   Hoặc gradient subtle:  │
│                        │   from-primary/5         │
│  [Email]               │   to-primary/20          │
│  [Password]            │                          │
│                        │   "Quản lý thời gian     │
│  [Đăng nhập] (full w)  │    thông minh hơn."      │
│                        │                          │
│  Chưa có tk? Đăng ký   │                          │
│                        │                          │
└────────────────────────┴──────────────────────────┘
        max-w-md mx-auto         hidden md:block
```

**Form card**:
- Center vertically
- max-width 400px
- Padding `p-8`
- Logo + title trên, form ở giữa, link "Chưa có tk?" ở dưới
- Input height 44px (lớn hơn default)
- Button `default` full-width, height 44px
- "Hoặc" divider + social login buttons (chuẩn bị cho tương lai)

### 3.3 Dashboard list pages (today / upcoming / overdue)

```
┌────────────────────────────────────────────────────┐
│ Hôm nay                              [+ Tạo lịch] │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ ┌──────────────────────────────────────────────┐  │
│ │ ▌ 09:00 — 10:30  ·  Hôm nay      🔴 Cao  ›   │  │
│ │ ▌ Họp review sprint 23                       │  │
│ │ ▌ Thảo luận progress + planning sprint 24    │  │
│ │ ▌ #work  #sprint                             │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ ┌──────────────────────────────────────────────┐  │
│ │ ▌ 14:00 — 15:00  ·  Hôm nay      🟡 Vừa  ›  │  │
│ │ ▌ Code review PR #234                        │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
└────────────────────────────────────────────────────┘
```

- **Group by section** khi list dài: "Sáng" / "Chiều" / "Tối" (với section header `text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 mt-6`)
- Trong "Sắp tới" 7 ngày: group theo ngày ("Mai", "Thứ 4 (15/05)", …)
- Hover card: `shadow-md` + nâng nhẹ 2px
- Click: mở **detail bottom sheet** (slide từ phải) thay vì điều hướng — giữ context list

### 3.4 Calendar page

Layout:
```
┌────────────────────────────────────────────────────┐
│ Lịch                            [Tháng|Tuần|Ngày] │
│ ─────────────────────────────────────────────────  │
│ < Tháng 5, 2026 >                       [Hôm nay] │
│                                                    │
│  T2  T3  T4  T5  T6  T7  CN                       │
│  ─────────────────────────────                     │
│  29  30   1   2   3   4   5                       │
│       ▌work    ▌meet                               │
│   6   7   8   9  10  11  12                       │
│  …                                                 │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Style override cho FullCalendar**:
- Bỏ border mặc định, dùng `border-border` của theme
- Today cell: `bg-primary/5`
- Event: rounded-md, height 24px, font-medium 13px, padding-x 6px
- Event color tô từ `PRIORITY_COLOR.bg` thay vì màu rực
- Hover event: scale-[1.02], shadow-sm
- Click event → mở **edit dialog** (chứ không bottom sheet) cho dễ sửa nhanh

CSS override:
```css
.fc {
  --fc-border-color: hsl(var(--border));
  --fc-today-bg-color: hsl(var(--primary) / 0.05);
  --fc-page-bg-color: hsl(var(--background));
  font-family: inherit;
}
.fc-button {
  @apply bg-secondary text-secondary-foreground hover:bg-accent
         border-0 rounded-md px-3 py-1.5 text-sm font-medium;
}
.fc-button-primary:not(:disabled).fc-button-active {
  @apply bg-primary text-primary-foreground;
}
.fc-event {
  @apply rounded-md border-0 px-1.5 py-0.5 text-xs font-medium cursor-pointer;
}
```

### 3.5 Schedule form dialog

```
┌──────────────────────────────────────┐
│  Tạo lịch mới                  ✕     │
│ ──────────────────────────────────── │
│                                      │
│  Tiêu đề *                           │
│  [VD: Họp review sprint........]     │
│                                      │
│  Mô tả                               │
│  [.............................]     │
│  [.............................]     │
│                                      │
│  ┌──────────┬──────────────────┐    │
│  │ Loại     │ Mức độ ưu tiên   │    │
│  │ [Cuộc họp│ [🟡 Vừa       ▾] │    │
│  └──────────┴──────────────────┘    │
│                                      │
│  ┌──────────┬──────────────────┐    │
│  │ Bắt đầu  │ Kết thúc         │    │
│  │ [📅 ...] │ [📅 ...]         │    │
│  └──────────┴──────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ 🔔 Nhắc trước                │    │
│  │ [📅 ............]            │    │
│  └──────────────────────────────┘    │
│                                      │
│  Lặp lại                             │
│  ⚪ Không  ⚪ Hằng ngày  ⚪ Hằng tuần │
│                                      │
│  Tag                                 │
│  [#work] [#sprint] [+ Thêm tag]      │
│                                      │
│ ──────────────────────────────────── │
│                  [Hủy]  [Tạo lịch]  │
└──────────────────────────────────────┘
   max-width: 540px
```

- Dialog overlay: `bg-background/80 backdrop-blur-sm`
- Dialog itself: `rounded-2xl shadow-lg border`
- Animation: fade + scale (95→100) + 250ms
- Close khi click outside hoặc Esc
- Focus trap: tab loop trong dialog
- Nhóm field theo logic (basic info → time → reminder → meta) với divider mảnh giữa nhóm

### 3.6 Settings page

```
┌─────────────────────────────────────┐
│ Cài đặt                             │
│ ─────────────────────────────────── │
│                                     │
│ Hồ sơ                               │
│ ┌─────────────────────────────────┐ │
│ │ Email      test@gmail.com       │ │
│ │ Tên        [____________]       │ │
│ │                       [Lưu]     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Thông báo                           │
│ ┌─────────────────────────────────┐ │
│ │ ☑ Push notification             │ │
│ │ ☐ Email reminder                │ │
│ │                                 │ │
│ │ Nhắc trước  [15 phút  ▾]        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Khung giờ làm việc                  │
│ ┌─────────────────────────────────┐ │
│ │ Bắt đầu  [09:00]                │ │
│ │ Kết thúc [18:00]                │ │
│ │ Múi giờ  [Asia/Ho_Chi_Minh ▾]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Giao diện                           │
│ ┌─────────────────────────────────┐ │
│ │ Theme   ⚪ Light ⚪ Dark ⚪ Auto │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

- Mỗi nhóm là 1 Card riêng với title bên ngoài card (`text-base font-semibold mb-3`)
- Trong card: dùng `divide-y` giữa các row settings
- Row layout: label trái + control phải, padding `py-3`

---

## 4. Mobile layout (Expo / React Native)

### 4.1 Bottom tab bar

```
┌────────────────────────────────────┐
│  Header (page title)               │
│  [+ Add quick]              [⚙️]   │
│ ────────────────────────────────── │
│                                    │
│  Content                           │
│  ScrollView                        │
│                                    │
│                                    │
│ ────────────────────────────────── │
│  🏠     📅     ➕     🔍     👤   │
│  Today  Sắp    Add    Tìm   Tôi   │
└────────────────────────────────────┘
```

- Tab bar height: 60px + safe area
- Active tab: icon + label primary color, có dot indicator nhỏ phía trên
- Inactive: icon outline muted, label muted
- Add tab: FAB style, bigger circle, primary background
- Background bar: `bg-background border-t border-border` (hoặc blur trên iOS)

### 4.2 Schedule list (mobile)

Sticky header với pull-to-refresh:
```
┌────────────────────────────────────┐
│ Hôm nay              [date filter] │  ← sticky
│ 4 lịch · 1 đã hoàn thành           │
│ ────────────────────────────────── │
│ Sáng                                │
│ ┌────────────────────────────────┐ │
│ │ ▌ 09:00 - 10:30  · Cao    ›   │ │
│ │ ▌ Họp review sprint 23        │ │
│ └────────────────────────────────┘ │
│ ┌────────────────────────────────┐ │
│ │ ▌ ...                          │ │
│ └────────────────────────────────┘ │
│ Chiều                               │
│ ┌────────────────────────────────┐ │
│ │ ...                            │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
                                  [+] FAB
```

- Pull-to-refresh: `RefreshControl` với primary tint
- Card padding-x match header (16px)
- Card spacing: `marginBottom: 12`
- Section header: `Sáng` / `Chiều` — `text-xs uppercase font-semibold tracking-wider text-muted-foreground` mb 8
- FAB ở góc dưới phải, position absolute, 56x56, primary, shadow lớn

### 4.3 Schedule swipe action (mobile)

Swipe trái → lộ 2 action: "Hoàn thành" (xanh) + "Xóa" (đỏ).
Swipe phải → lộ 1 action: "Sửa" (primary).

Dùng `react-native-gesture-handler` `Swipeable`. Threshold 80px. Spring animation khi release.

### 4.4 Add schedule (mobile)

**Modal full screen** (slide từ dưới lên), không phải dialog nhỏ:

```
┌────────────────────────────────────┐
│  Hủy           Lịch mới       Lưu  │  ← header với cancel/save
│ ────────────────────────────────── │
│                                    │
│  Tiêu đề                           │
│  [.............................]   │
│                                    │
│  Mô tả                             │
│  [.............................]   │
│                                    │
│  ⏰ Thời gian                       │
│  Bắt đầu      [29/04 09:00]       │
│  Kết thúc     [29/04 10:30]       │
│                                    │
│  🎯 Loại                           │
│  [Cuộc họp  ▾]                    │
│                                    │
│  📌 Mức độ                         │
│  [🔴 Cao] [🟡 Vừa] [🟢 Thấp]      │
│                                    │
│  🔔 Nhắc trước                    │
│  [10 phút  ▾]                     │
│                                    │
└────────────────────────────────────┘
```

- Header trắng, sticky, có border-bottom subtle
- Cancel/Save button text-only, font-medium
- Save button disabled (gray) cho đến khi title không rỗng
- DateTime input dùng native picker (iOS spinner / Android dialog)
- Priority chọn bằng segmented control (3 ô liền nhau, active có background primary)

### 4.5 Schedule detail (mobile)

**Bottom sheet** scroll lên dần, không full screen:

```
       ┌────────────────────────┐
       │   ───  (drag handle)   │
       │                        │
       │  🔴 Cao                │
       │                        │
       │  Họp review sprint 23  │
       │  ─────────────────────│
       │                        │
       │  ⏰ 09:00 - 10:30      │
       │  📅 Hôm nay, 29/04     │
       │  🔁 Lặp hằng tuần      │
       │  🔔 Nhắc trước 10p     │
       │                        │
       │  📝 Thảo luận progress │
       │                        │
       │  🏷  #work #sprint      │
       │                        │
       │  👥 Chia sẻ với 2 người│
       │                        │
       │ [Hoàn thành] [⋯]      │
       │                        │
       └────────────────────────┘
```

- Drag handle ở top (4x40 rounded full, muted color)
- Snap points: 50% / 90%
- Background blur overlay
- "Hoàn thành" là primary button full-width
- "⋯" mở menu: Sửa / Sao chép / Chia sẻ / Xóa

### 4.6 Theme stylesheet (mobile)

```ts
// mobile/theme.ts
export const lightTheme = {
  colors: {
    background: '#FFFFFF',
    foreground: '#0F172A',
    card: '#FFFFFF',
    cardForeground: '#0F172A',
    muted: '#F1F5F9',
    mutedForeground: '#64748B',
    border: '#E2E8F0',
    primary: '#2563EB',
    primaryForeground: '#FFFFFF',
    destructive: '#EF4444',
    success: '#16A34A',
    warning: '#F59E0B',
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  radius: { sm: 4, md: 10, lg: 12, xl: 16 },
  fontSize: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, xxl: 24 },
};
```

Dùng qua `ThemeContext`:
```tsx
const { colors } = useTheme();
<View style={{ backgroundColor: colors.card }}>...</View>
```

---

## 5. Dark mode

### Web

shadcn/ui đã setup CSS variables → đổi class `dark` trên `<html>` là đủ. Dùng `next-themes`:

```tsx
// app/providers.tsx
import { ThemeProvider } from "next-themes";

<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>
```

Toggle button:
```tsx
const { theme, setTheme } = useTheme();
<Button variant="ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
  {theme === 'dark' ? <Sun /> : <Moon />}
</Button>
```

### Mobile

Dùng `useColorScheme()` từ React Native + ThemeContext expose `lightTheme`/`darkTheme`. User override trong settings → lưu AsyncStorage `theme_pref`.

---

## 6. Accessibility

### MUST

- Contrast ratio ≥ 4.5:1 cho body text, ≥ 3:1 cho UI elements lớn
- Focus visible: ring 2px, offset 2px (không chỉ underline)
- Tab order logic theo visual flow
- Touch target ≥ 44x44px (mobile), 32x32px (web)
- Form input có label (không chỉ placeholder)
- Button có `aria-label` nếu chỉ icon
- Lỗi form: `aria-invalid="true"` + `aria-describedby={errorId}`

### Reduce motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

```tsx
// mobile
import { useReduceMotion } from 'react-native-reanimated';
const reduceMotion = useReduceMotion();
const duration = reduceMotion ? 0 : 250;
```

### Vietnamese readability

- Tránh title quá dài 1 dòng — line-clamp 2 + ellipsis
- Date/time format: `DD/MM HH:mm` hoặc `DD tháng MM, HH:mm` cho format dài
- Số đếm: `5 lịch` (số trước, đơn vị sau, có space)
- Action verb: ngắn gọn, mệnh lệnh — "Tạo", "Lưu", "Xóa" (không "Hãy tạo lịch mới")

---

## 7. Roadmap apply design system

### Phase 1 — Foundation (1-2 tuần)
- [ ] Cài `next-themes` + setup dark mode toggle
- [ ] Update `tailwind.config.ts` thêm tokens (success, warning, priority colors)
- [ ] Tạo `web/components/schedule/schedule-card.tsx` v2 với layout mới (left bar, hover lift)
- [ ] Tạo `web/components/empty-state.tsx` reusable
- [ ] Tạo `web/components/skeleton/schedule-card-skeleton.tsx`
- [ ] Mobile: tạo `mobile/theme/index.ts` + `ThemeProvider`

### Phase 2 — Polish chính (1-2 tuần)
- [ ] Refactor login/register thành split layout
- [ ] Refactor schedule form dialog (group fields, divider, animation)
- [ ] Refactor calendar page (CSS overrides cho FullCalendar)
- [ ] Refactor settings page (group cards, divide-y)
- [ ] Mobile: schedule card mới + swipe action
- [ ] Mobile: bottom sheet detail
- [ ] Mobile: full-screen modal cho add/edit

### Phase 3 — Delight (1 tuần)
- [ ] Skeleton loading cho mọi list page
- [ ] Toast với undo cho destructive action
- [ ] Page transitions (web)
- [ ] Pull-to-refresh (mobile)
- [ ] Dark mode hoàn chỉnh + persist preference
- [ ] Empty state minh hoạ illustration nhẹ (svg, không nặng)
- [ ] Micro-interaction: priority badge có dot pulse khi high
- [ ] Confetti/check animation khi mark completed

### Phase 4 — Advanced (sau MVP)
- [ ] Command palette `Cmd+K` (web)
- [ ] Drag-drop event trên calendar (FullCalendar built-in)
- [ ] Customizable color cho từng tag
- [ ] Custom illustration set (Storyset hoặc tự vẽ)
- [ ] Keyboard shortcuts cho power user
- [ ] Onboarding flow lần đầu đăng nhập

---

## 8. Tham chiếu & resources

- **Tailwind CSS docs**: https://tailwindcss.com
- **shadcn/ui**: https://ui.shadcn.com — copy component và customize
- **Radix UI Colors**: https://www.radix-ui.com/colors — palette tham khảo
- **Lucide icons**: https://lucide.dev — search icon nhanh
- **Inter font**: https://rsms.me/inter/
- **React Native Reanimated**: https://docs.swmansion.com/react-native-reanimated/
- **React Native Gesture Handler** (swipe): https://docs.swmansion.com/react-native-gesture-handler/
- **next-themes**: https://github.com/pacocoursey/next-themes
- **TailwindUI examples** (paid, nhưng tham khảo được pattern): https://tailwindui.com
- **Mobile design**: https://mobbin.com — screenshots app thật để reference
- **Cron / Notion Calendar UI**: https://calendar.notion.so

---

## 9. Quy ước khi áp dụng

- **Không tự sinh class Tailwind dài lê thê inline** — gom vào component reusable hoặc dùng `cn()` helper
- **Không dùng !important** — thay bằng specificity cao hơn hoặc class arbitrary
- **Không hard-code color hex trong JSX** — dùng `text-primary`, `bg-card` tokens
- **Mobile: không inline style trừ giá trị động** — dùng `StyleSheet.create()` hoặc styled components
- **Component design first** — vẽ trên giấy / Figma trước khi code, đừng improvise
- **Test trên cả light + dark + responsive** trước khi merge PR
- **Mọi page mới phải có**: empty state + loading skeleton + error state

---

> Tài liệu này là **living doc** — cập nhật khi có quy ước mới. PR thay đổi design tokens phải có ảnh chụp before/after.
