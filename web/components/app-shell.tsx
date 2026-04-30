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

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 flex-col border-r bg-card md:flex">
        <div className="border-b p-6">
          <h1 className="text-xl font-bold">SmartSchedule</h1>
          <p className="mt-1 text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-muted/20">{children}</main>
    </div>
  );
}
