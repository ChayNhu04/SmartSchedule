"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8", className)}
        aria-label="Đổi giao diện"
      >
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const next = theme === "dark" ? "system" : theme === "system" ? "light" : "dark";
  const Icon = theme === "dark" ? Moon : theme === "system" ? Monitor : Sun;
  const label =
    theme === "dark" ? "Đang dùng tối" : theme === "system" ? "Đang dùng hệ thống" : "Đang dùng sáng";

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8", className)}
      onClick={() => setTheme(next)}
      title={`${label}. Click để chuyển.`}
      aria-label="Đổi giao diện"
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
