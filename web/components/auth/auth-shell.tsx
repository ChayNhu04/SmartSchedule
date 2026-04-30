import { CalendarDays, Sparkles, Repeat, BellRing } from "lucide-react";

interface Props {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const HIGHLIGHTS = [
  {
    icon: CalendarDays,
    title: "Quản lý lịch tập trung",
    desc: "Hôm nay, sắp tới, quá hạn — gom 1 chỗ duy nhất.",
  },
  {
    icon: Repeat,
    title: "Lịch lặp linh hoạt",
    desc: "Hằng ngày / tuần / tháng. Bỏ qua hoặc dời từng instance.",
  },
  {
    icon: BellRing,
    title: "Nhắc nhở thông minh",
    desc: "Push tới mobile + email tổng kết hàng ngày.",
  },
];

export function AuthShell({ title, subtitle, children }: Props) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary/95 via-primary to-blue-600 p-10 text-primary-foreground lg:flex">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 20%, hsl(var(--primary-foreground) / 0.4) 0%, transparent 40%), radial-gradient(circle at 80% 60%, hsl(var(--primary-foreground) / 0.25) 0%, transparent 50%)",
          }}
          aria-hidden
        />
        <div className="relative">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="h-5 w-5" />
            SmartSchedule
          </div>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold leading-tight">
            Mọi lịch của bạn,
            <br />
            ở đúng nơi cần.
          </h2>
          <p className="mt-3 text-base text-primary-foreground/80">
            Quản lý task, meeting, event và reminder — đồng bộ giữa web và mobile.
          </p>

          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((h) => (
              <li key={h.title} className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15 backdrop-blur">
                  <h.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">{h.title}</p>
                  <p className="text-sm text-primary-foreground/75">{h.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} SmartSchedule
        </div>
      </aside>

      <main className="flex items-center justify-center bg-background px-6 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="h-5 w-5 text-primary" />
              SmartSchedule
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}
