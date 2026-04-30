"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Calendar,
  AlarmClock,
  ClipboardList,
  LayoutTemplate,
  LogOut,
  Search,
  Settings,
  Sparkles,
  Tag as TagIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/today", label: "Hôm nay", icon: Sparkles },
  { href: "/upcoming", label: "Sắp tới", icon: ClipboardList },
  { href: "/overdue", label: "Quá hạn", icon: AlarmClock },
  { href: "/calendar", label: "Lịch tháng", icon: Calendar },
  { href: "/search", label: "Tìm kiếm", icon: Search },
  { href: "/tags", label: "Nhãn", icon: TagIcon },
  { href: "/templates", label: "Template", icon: LayoutTemplate },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

function initials(input?: string | null) {
  if (!input) return "?";
  const parts = input.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "?";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { hydrate, hydrated, token, user, logout } = useAuth();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated && !token) router.replace("/login");
  }, [hydrated, token, router]);

  if (!hydrated || !token) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const displayName = user?.display_name || user?.email?.split("@")[0] || "User";

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-60 flex-col border-r bg-card md:flex">
        <div className="flex h-14 items-center justify-between border-b px-5">
          <Link href="/today" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <span className="text-base font-semibold">SmartSchedule</span>
          </Link>
          <ThemeToggle />
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 scrollbar-thin">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                  )}
                  strokeWidth={2}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-3">
          <div className="flex items-center gap-3 rounded-md p-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
              {initials(user?.display_name ?? user?.email)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              title="Đăng xuất"
              aria-label="Đăng xuất"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
