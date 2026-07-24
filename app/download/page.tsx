"use client";

import React from "react";
import { useRouter } from "next/navigation";
import InstallButtons from "@/components/InstallButtons";
import { SITE } from "@/lib/site";
import { themeVars, useSharedTheme } from "@/lib/theme";

function cardStyle(tone: "default" | "good" | "warn" = "default"): React.CSSProperties {
  const border = tone === "good" ? "var(--success-border)" : tone === "warn" ? "var(--warn-border)" : "var(--border)";
  const bg = tone === "good" ? "var(--success-bg)" : tone === "warn" ? "var(--warn-bg)" : "var(--panel-bg)";
  return {
    borderRadius: 22,
    border: `1px solid ${border}`,
    background: bg,
    padding: 22,
    display: "grid",
    gap: 14,
  };
}

function pillStyle(): React.CSSProperties {
  return {
    display: "inline-flex",
    width: "fit-content",
    borderRadius: 999,
    border: "1px solid var(--accent-border)",
    background: "var(--accent-soft)",
    padding: "7px 11px",
    color: "var(--text-soft)",
    fontSize: 12,
    fontWeight: 850,
  };
}

function secondaryButton(): React.CSSProperties {
  return {
    padding: "14px 16px",
    borderRadius: 16,
    border: "1px solid var(--border-strong)",
    background: "var(--button-bg)",
    color: "var(--text)",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 14,
    width: "100%",
  };
}

export default function DownloadPage() {
  const router = useRouter();
  const { resolvedMode } = useSharedTheme();

  return (
    <main style={{ minHeight: "100vh", background: "var(--app-bg)", color: "var(--text)", ...themeVars(resolvedMode) }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "18px 14px 64px", display: "grid", gap: 24 }}>
        <header style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "56px minmax(0, 1fr)", gap: 12, alignItems: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, overflow: "hidden", border: "1px solid var(--accent-border)", background: "var(--surface-strong)" }}>
              <img src="/bms-logo.jpg" alt={`${SITE.companyName} logo`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: "var(--text)", fontWeight: 950, fontSize: "clamp(20px, 4vw, 24px)", lineHeight: 1.05 }}>{SITE.name}</div>
              <div style={{ marginTop: 6, color: "var(--gold)", fontWeight: 800, fontSize: 13 }}>Install on web, Android, iPhone, iPad, and tablet</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
            <button onClick={() => router.push("/")} style={secondaryButton()}>Homepage</button>
            <button onClick={() => router.push("/pricing")} style={secondaryButton()}>Pricing</button>
            <button onClick={() => router.push("/login")} style={secondaryButton()}>Login</button>
            <button onClick={() => router.push("/support")} style={secondaryButton()}>Support</button>
          </div>
        </header>

        <section style={cardStyle("good")}>
          <div style={pillStyle()}>Download / Install</div>
          <h1 style={{ margin: 0, color: "var(--text)", fontSize: "clamp(34px, 7vw, 58px)", lineHeight: 1.02, letterSpacing: -1.1, fontWeight: 950 }}>
            Use Naija Tax Guide like an app on your phone or tablet.
          </h1>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 17, lineHeight: 1.85, maxWidth: 880 }}>
            You can use the web app immediately, install it on Android and tablet browsers that support app installation, or add it to the iPhone/iPad home screen through Safari.
          </p>
          <InstallButtons appHref="/login" />
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          <div style={cardStyle()}>
            <div style={pillStyle()}>Android / Tablet</div>
            <h2 style={{ margin: 0 }}>Chrome install</h2>
            <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.75 }}>Open the site in Chrome, tap the browser menu, then choose Install app or Add to Home screen when available.</p>
          </div>
          <div style={cardStyle()}>
            <div style={pillStyle()}>iPhone / iPad</div>
            <h2 style={{ margin: 0 }}>Safari home screen</h2>
            <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.75 }}>Open the site in Safari, tap Share, then choose Add to Home Screen. This creates an app-style icon on your device.</p>
          </div>
          <div style={cardStyle("warn")}>
            <div style={pillStyle()}>App stores</div>
            <h2 style={{ margin: 0 }}>Coming later</h2>
            <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.75 }}>Google Play and Apple App Store links will be added after the native wrapper and payment policy review are ready.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
