"use client";

import { create } from "zustand";
import type { AuthUser } from "@smartschedule/shared";
import { TOKEN_KEY } from "@/lib/api";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  hydrate: () => void;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrated: false,

  hydrate: () => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem(TOKEN_KEY);
    const raw = window.localStorage.getItem("auth_user");
    set({
      token,
      user: raw ? (JSON.parse(raw) as AuthUser) : null,
      hydrated: true,
    });
  },

  setAuth: (token, user) => {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem("auth_user", JSON.stringify(user));
    set({ token, user, hydrated: true });
  },

  logout: () => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem("auth_user");
    set({ token: null, user: null, hydrated: true });
  },
}));
