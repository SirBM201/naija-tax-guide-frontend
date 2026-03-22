"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemeMode = "dark" | "light" | "system";
export type ResolvedThemeMode = "dark" | "light";

type ThemeContextValue = {
  themeMode: ThemeMode;
  resolvedMode: ResolvedThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
};

const THEME_STORAGE_KEY = "ntg_theme_mode";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveSystemTheme(): ResolvedThemeMode {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function resolveTheme(mode: ThemeMode): ResolvedThemeMode {
  if (mode === "system") return resolveSystemTheme();
  return mode;
}

export function themeVars(mode: ResolvedThemeMode): React.CSSProperties {
  if (mode === "light") {
    return {
      ["--app-bg" as any]: "#f5f7fb",
      ["--panel-bg" as any]: "#ffffff",
      ["--surface" as any]: "#ffffff",
      ["--surface-soft" as any]: "#f7f9fc",
      ["--text" as any]: "#0f172a",
      ["--text-soft" as any]: "#1e293b",
      ["--text-muted" as any]: "#475569",
      ["--text-faint" as any]: "#64748b",
      ["--border" as any]: "rgba(15,23,42,0.10)",
      ["--border-strong" as any]: "rgba(15,23,42,0.18)",
      ["--accent-soft" as any]: "rgba(99,102,241,0.12)",
      ["--accent-border" as any]: "rgba(99,102,241,0.30)",
      ["--success-bg" as any]: "rgba(16,185,129,0.10)",
      ["--success-border" as any]: "rgba(16,185,129,0.24)",
      ["--danger-bg" as any]: "rgba(239,68,68,0.08)",
      ["--danger-border" as any]: "rgba(239,68,68,0.22)",
      ["--button-bg" as any]: "#eef2ff",
      ["--gold" as any]: "#b45309",
    };
  }

  return {
    ["--app-bg" as any]: "#050816",
    ["--panel-bg" as any]: "#081127",
    ["--surface" as any]: "#081127",
    ["--surface-soft" as any]: "rgba(255,255,255,0.03)",
    ["--text" as any]: "#ffffff",
    ["--text-soft" as any]: "rgba(255,255,255,0.92)",
    ["--text-muted" as any]: "rgba(255,255,255,0.78)",
    ["--text-faint" as any]: "rgba(255,255,255,0.60)",
    ["--border" as any]: "rgba(255,255,255,0.10)",
    ["--border-strong" as any]: "rgba(255,255,255,0.18)",
    ["--accent-soft" as any]: "rgba(99,102,241,0.18)",
    ["--accent-border" as any]: "rgba(99,102,241,0.40)",
    ["--success-bg" as any]: "rgba(16,185,129,0.12)",
    ["--success-border" as any]: "rgba(16,185,129,0.28)",
    ["--danger-bg" as any]: "rgba(239,68,68,0.10)",
    ["--danger-border" as any]: "rgba(239,68,68,0.28)",
    ["--button-bg" as any]: "rgba(255,255,255,0.05)",
    ["--gold" as any]: "#facc15",
  };
}

export function themeChipStyle(active: boolean): React.CSSProperties {
  return {
    minHeight: 42,
    padding: "10px 14px",
    borderRadius: 14,
    border: active
      ? "1px solid var(--accent-border)"
      : "1px solid var(--border)",
    background: active ? "var(--accent-soft)" : "var(--surface-soft)",
    color: "var(--text)",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
  };
}

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("dark");
  const [resolvedMode, setResolvedMode] = useState<ResolvedThemeMode>("dark");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = (window.localStorage.getItem(THEME_STORAGE_KEY) ||
      "dark") as ThemeMode;

    const initialMode: ThemeMode =
      saved === "dark" || saved === "light" || saved === "system"
        ? saved
        : "dark";

    setThemeModeState(initialMode);
    setResolvedMode(resolveTheme(initialMode));

    const media = window.matchMedia("(prefers-color-scheme: light)");

    const onChange = () => {
      setResolvedMode((current) => {
        if (initialMode === "system") {
          return media.matches ? "light" : "dark";
        }
        return current;
      });
    };

    media.addEventListener?.("change", onChange);

    return () => {
      media.removeEventListener?.("change", onChange);
    };
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    setResolvedMode(resolveTheme(mode));

    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    }
  };

  const value = useMemo(
    () => ({
      themeMode,
      resolvedMode,
      setThemeMode,
    }),
    [themeMode, resolvedMode]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useSharedTheme() {
  const ctx = useContext(ThemeContext);

  if (!ctx) {
    throw new Error("useSharedTheme must be used inside ThemeProvider");
  }

  return ctx;
}