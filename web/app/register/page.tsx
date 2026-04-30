"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/auth-shell";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import type { AuthResponse } from "@smartschedule/shared";

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuth((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post<AuthResponse>("/auth/register", {
        email,
        password,
        display_name: displayName || undefined,
      });
      setAuth(data.access_token, data.user);
      router.replace("/today");
      toast.success("Tạo tài khoản thành công");
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Đăng ký thất bại";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Tạo tài khoản" subtitle="Bắt đầu quản lý lịch của bạn — miễn phí.">
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="display-name">Tên hiển thị</Label>
          <Input
            id="display-name"
            placeholder="Nguyễn Văn A"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="ban@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mật khẩu</Label>
          <Input
            id="password"
            type="password"
            minLength={6}
            placeholder="Tối thiểu 6 ký tự"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">Tối thiểu 6 ký tự.</p>
        </div>
        <Button className="w-full" type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Tạo tài khoản
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Đăng nhập
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
