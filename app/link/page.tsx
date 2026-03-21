"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function LinkPage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(900px 700px at 20% 10%, rgba(120,140,255,0.22), transparent 60%), rgba(7,10,18,1)",
        color: "white",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 860,
          borderRadius: 22,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.04)",
          padding: 24,
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 950, letterSpacing: -1 }}>
          Link Channels
        </div>

        <div
          style={{
            marginTop: 10,
            color: "rgba(255,255,255,0.78)",
            lineHeight: 1.7,
            fontSize: 15,
            maxWidth: 720,
          }}
        >
          This page is currently disabled in the present release. Channel linking
          for WhatsApp and Telegram is planned for a later stage after the main
          billing and dashboard flow is fully stabilized.
        </div>

        <div
          style={{
            marginTop: 22,
            padding: "16px 18px",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(0,0,0,0.20)",
            color: "rgba(255,255,255,0.88)",
            lineHeight: 1.7,
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Current status</div>
          <div>• Channel-link generation is intentionally turned off.</div>
          <div>• No Supabase session check is required on this page for now.</div>
          <div>• This placeholder keeps the route safe during deployment.</div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginTop: 22,
          }}
        >
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              padding: "14px 18px",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.08)",
              color: "white",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Go to Dashboard
          </button>

          <button
            onClick={() => router.push("/support")}
            style={{
              padding: "14px 18px",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Open Support
          </button>
        </div>
      </div>
    </div>
  );
}