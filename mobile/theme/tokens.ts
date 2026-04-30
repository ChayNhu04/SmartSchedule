// Design tokens — mirror DESIGN.md.
// Tất cả values dạng absolute (RN không có HSL var).

export interface ColorPalette {
  background: string;
  card: string;
  surface: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  primaryForeground: string;
  primaryMuted: string;
  destructive: string;
  destructiveForeground: string;
  destructiveMuted: string;
  success: string;
  successMuted: string;
  warning: string;
  warningMuted: string;
  priorityLow: string;
  priorityNormal: string;
  priorityHigh: string;
  shadow: string;
  overlay: string;
}

export const lightColors: ColorPalette = {
  background: "#FFFFFF",
  card: "#FFFFFF",
  surface: "#F8FAFC",
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",

  text: "#0F172A",
  textMuted: "#64748B",
  textSubtle: "#94A3B8",

  primary: "#2563EB",
  primaryForeground: "#FFFFFF",
  primaryMuted: "#DBEAFE",

  destructive: "#DC2626",
  destructiveForeground: "#FFFFFF",
  destructiveMuted: "#FEE2E2",

  success: "#16A34A",
  successMuted: "#DCFCE7",

  warning: "#F59E0B",
  warningMuted: "#FEF3C7",

  priorityLow: "#22C55E",
  priorityNormal: "#F59E0B",
  priorityHigh: "#EF4444",

  shadow: "rgba(15, 23, 42, 0.08)",
  overlay: "rgba(15, 23, 42, 0.4)",
};

export const darkColors: ColorPalette = {
  background: "#0B1220",
  card: "#111827",
  surface: "#0F172A",
  border: "#1E293B",
  borderStrong: "#334155",

  text: "#F8FAFC",
  textMuted: "#94A3B8",
  textSubtle: "#64748B",

  primary: "#3B82F6",
  primaryForeground: "#0B1220",
  primaryMuted: "#1E3A8A",

  destructive: "#F87171",
  destructiveForeground: "#0B1220",
  destructiveMuted: "#7F1D1D",

  success: "#4ADE80",
  successMuted: "#14532D",

  warning: "#FBBF24",
  warningMuted: "#78350F",

  priorityLow: "#4ADE80",
  priorityNormal: "#FBBF24",
  priorityHigh: "#F87171",

  shadow: "rgba(0, 0, 0, 0.4)",
  overlay: "rgba(0, 0, 0, 0.6)",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

export const typography = {
  display: { fontSize: 30, fontWeight: "700" as const, lineHeight: 36 },
  h1: { fontSize: 24, fontWeight: "700" as const, lineHeight: 32 },
  h2: { fontSize: 20, fontWeight: "600" as const, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: "600" as const, lineHeight: 24 },
  bodyLg: { fontSize: 16, fontWeight: "400" as const, lineHeight: 24 },
  body: { fontSize: 14, fontWeight: "400" as const, lineHeight: 20 },
  bodyStrong: { fontSize: 14, fontWeight: "600" as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: "400" as const, lineHeight: 16 },
  captionStrong: { fontSize: 12, fontWeight: "600" as const, lineHeight: 16 },
} as const;

export const elevation = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  soft: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  elevated: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;
