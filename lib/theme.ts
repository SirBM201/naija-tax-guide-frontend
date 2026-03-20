"use client";

import React from "react";

export type ThemeMode = "dark" | "light" | "system";

export const THEME_STORAGE_KEY = "ntg-theme";
export const THEME_EVENT = "ntg-theme-change";

export function resolveTheme(mode: ThemeMode): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  if (mode === "dark" || mode === "light") return mode;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  return saved === "dark" || saved === "light" || saved === "system" ? saved : "system";
}

export function setStoredTheme(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { mode } }));
}

export function themeVars(mode: "dark" | "light"): React.CSSProperties {
  if (mode === "light") {
    return {
      ["--app-bg" as any]:
        "radial-gradient(1000px 750px at 18% 10%, rgba(22,163,74,0.10), transparent 60%), linear-gradient(180deg, #f8fafc 0%, #eef2f6 100%)",
      ["--surface" as any]: "rgba(255,255,255,0.84)",
      ["--surface-strong" as any]: "rgba(255,255,255,0.96)",
      ["--surface-soft" as any]: "rgba(248,250,252,0.92)",
      ["--panel-bg" as any]: "rgba(255,255,255,0.72)",
      ["--panel-dark" as any]: "rgba(255,255,255,0.90)",
      ["--border" as any]: "rgba(15,23,42,0.10)",
      ["--border-strong" as any]: "rgba(15,23,42,0.14)",
      ["--text" as any]: "#0f172a",
      ["--text-soft" as any]: "#334155",
      ["--text-muted" as any]: "#475569",
      ["--text-faint" as any]: "#64748b",
      ["--accent" as any]: "#166534",
      ["--accent-soft" as any]: "rgba(22,101,52,0.10)",
      ["--accent-border" as any]: "rgba(22,101,52,0.20)",
      ["--success-bg" as any]: "rgba(34,197,94,0.10)",
      ["--success-border" as any]: "rgba(34,197,94,0.22)",
      ["--warn-bg" as any]: "rgba(245,158,11,0.10)",
      ["--warn-border" as any]: "rgba(245,158,11,0.22)",
      ["--danger-bg" as any]: "rgba(239,68,68,0.10)",
      ["--danger-border" as any]: "rgba(239,68,68,0.22)",
      ["--button-bg" as any]: "rgba(15,23,42,0.04)",
      ["--button-bg-strong" as any]: "rgba(22,101,52,0.10)",
      ["--gold" as any]: "#b68a2a",
      ["--gold-soft" as any]: "rgba(182,138,42,0.12)",
      ["--input-bg" as any]: "rgba(255,255,255,0.94)",
    };
  }

  return {
    ["--app-bg" as any]:
      "radial-gradient(1000px 750px at 18% 10%, rgba(22,163,74,0.16), transparent 60%), linear-gradient(180deg, #07111f 0%, #08101a 100%)",
    ["--surface" as any]: "rgba(255,255,255,0.05)",
    ["--surface-strong" as any]: "rgba(255,255,255,0.07)",
    ["--surface-soft" as any]: "rgba(0,0,0,0.18)",
    ["--panel-bg" as any]: "rgba(255,255,255,0.04)",
    ["--panel-dark" as any]: "rgba(0,0,0,0.18)",
    ["--border" as any]: "rgba(255,255,255,0.10)",
    ["--border-strong" as any]: "rgba(255,255,255,0.14)",
    ["--text" as any]: "#ffffff",
    ["--text-soft" as any]: "rgba(255,255,255,0.88)",
    ["--text-muted" as any]: "rgba(255,255,255,0.76)",
    ["--text-faint" as any]: "rgba(255,255,255,0.62)",
    ["--accent" as any]: "#22c55e",
    ["--accent-soft" as any]: "rgba(34,197,94,0.10)",
    ["--accent-border" as any]: "rgba(34,197,94,0.22)",
    ["--success-bg" as any]: "rgba(80,220,140,0.08)",
    ["--success-border" as any]: "rgba(80,220,140,0.22)",
    ["--warn-bg" as any]: "rgba(255,180,80,0.08)",
    ["--warn-border" as any]: "rgba(255,180,80,0.22)",
    ["--danger-bg" as any]: "rgba(255,80,80,0.08)",
    ["--danger-border" as any]: "rgba(255,110,110,0.22)",
    ["--button-bg" as any]: "rgba(255,255,255,0.06)",
    ["--button-bg-strong" as any]: "rgba(255,255,255,0.08)",
    ["--gold" as any]: "#d4a53a",
    ["--gold-soft" as any]: "rgba(212,165,58,0.12)",
    ["--input-bg" as any]: "rgba(0,0,0,0.22)",
  };
}

export function themeChipStyle(active: boolean): React.CSSProperties {
  return {
    padding: "10px 12px",
    borderRadius: 12,
    border: active ? "1px solid var(--accent-border)" : "1px solid var(--border)",
    background: active ? "var(--accent-soft)" : "var(--button-bg)",
    color: "var(--text)",
    fontWeight: 800,
    cursor: "pointer",
  };
}

export function useSharedTheme() {
  const [themeMode, setThemeModeState] = React.useState<ThemeMode>("system");
  const [resolvedMode, setResolvedMode] = React.useState<"dark" | "light">("dark");

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const applyThemeMode = (mode: ThemeMode) => {
      setThemeModeState(mode);
      setResolvedMode(resolveTheme(mode));
    };

    applyThemeMode(getStoredTheme());

    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key === THEME_STORAGE_KEY) {
        applyThemeMode(getStoredTheme());
      }
    };

    const handleThemeEvent = (e: Event) => {
      const custom = e as CustomEvent<{ mode?: ThemeMode }>;
      const mode = custom.detail?.mode;
      if (mode === "dark" || mode === "light" || mode === "system") {
        applyThemeMode(mode);
      } else {
        applyThemeMode(getStoredTheme());
      }
    };

    const handleMediaChange = () => {
      applyThemeMode(getStoredTheme());
    };

    const media = window.matchMedia("(prefers-color-scheme: light)");

    window.addEventListener("storage", handleStorage);
    window.addEventListener(THEME_EVENT, handleThemeEvent as EventListener);
    media.addEventListener?.("change", handleMediaChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(THEME_EVENT, handleThemeEvent as EventListener);
      media.removeEventListener?.("change", handleMediaChange);
    };
  }, []);

  const setThemeMode = React.useCallback((mode: ThemeMode) => {
    setStoredTheme(mode);
  }, []);

  return {
    themeMode,
    resolvedMode,
    setThemeMode,
  };
}