"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function LinkPage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "16px 12px",
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
          padding: "clamp(18px, 4vw, 24px)",
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontSize: "clamp(30px, 8vw, 40px)",
            fontWeight: 950,
            letterSpacing: -1,
            lineHeight: 1.05,
            wordBreak: "break-word",
          }}
        >
          Link Channels
        </div>

        <div
          style={{
            marginTop: 10,
            color: "rgba(255,255,255,0.78)",
            lineHeight: 1.7,
            fontSize: "clamp(14px, 3.6vw, 15px)",
            maxWidth: 720,
            wordBreak: "break-word",
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
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontWeight: 900,
              marginBottom: 8,
              fontSize: "clamp(15px, 3.8vw, 16px)",
              wordBreak: "break-word",
            }}
          >
            Current status
          </div>
          <div style={{ wordBreak: "break-word" }}>
            • Channel-link generation is intentionally turned off.
          </div>
          <div style={{ wordBreak: "break-word" }}>
            • No Supabase session check is required on this page for now.
          </div>
          <div style={{ wordBreak: "break-word" }}>
            • This placeholder keeps the route safe during deployment.
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
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
              width: "100%",
              minWidth: 0,
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
              width: "100%",
              minWidth: 0,
            }}
          >
            Open Support
          </button>
        </div>
      </div>
    </div>
  );
}
