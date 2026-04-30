import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { darkColors, lightColors, type ColorPalette } from "./tokens";

export type ThemeMode = "system" | "light" | "dark";

interface ThemeContextValue {
  mode: ThemeMode;
  scheme: "light" | "dark";
  colors: ColorPalette;
  setMode: (m: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "@smartschedule:theme-mode";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === "light" || v === "dark" || v === "system") setModeState(v);
    });
  }, []);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(STORAGE_KEY, m).catch(() => undefined);
  };

  const scheme: "light" | "dark" =
    mode === "system" ? (system === "dark" ? "dark" : "light") : mode;

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      scheme,
      colors: scheme === "dark" ? darkColors : lightColors,
      setMode,
    }),
    [mode, scheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme phải được gọi trong ThemeProvider");
  return ctx;
}
