import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthUser {
  id: string;
  email: string;
  display_name: string | null;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  hydrate: () => Promise<void>;
  setAuth: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,

  hydrate: async () => {
    const [token, raw] = await Promise.all([
      AsyncStorage.getItem("auth_token"),
      AsyncStorage.getItem("auth_user"),
    ]);
    set({ token, user: raw ? JSON.parse(raw) : null });
  },

  setAuth: async (token, user) => {
    await AsyncStorage.setItem("auth_token", token);
    await AsyncStorage.setItem("auth_user", JSON.stringify(user));
    set({ token, user });
  },

  logout: async () => {
    await AsyncStorage.multiRemove(["auth_token", "auth_user"]);
    set({ token: null, user: null });
  },
}));
