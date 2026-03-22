"use client";

import React, { useEffect } from "react";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider, themeVars, useSharedTheme } from "@/lib/theme";

function ThemeSurface({ children }: { children: React.ReactNode }) {
  const { resolvedMode } = useSharedTheme();

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.documentElement.setAttribute("data-theme", resolvedMode);
    document.documentElement.style.colorScheme = resolvedMode;
    document.body.style.margin = "0";
    document.body.style.minHeight = "100vh";
    document.body.style.background = "var(--app-bg)";
    document.body.style.color = "var(--text)";
  }, [resolvedMode]);

  return (
    <div
      style={{
        ...themeVars(resolvedMode),
        minHeight: "100vh",
        background: "var(--app-bg)",
        color: "var(--text)",
      }}
    >
      {children}
    </div>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ThemeSurface>{children}</ThemeSurface>
      </AuthProvider>
    </ThemeProvider>
  );
}