"use client";

import React from "react";
import { useRouter } from "next/navigation";

type Props = {
  title?: string;
  message?: string;
  reason?: string | null;
  details?: any;
};

export default function SubscriptionRequiredCard({
  title = "Subscription Required",
  message = "Your current plan does not allow access to this feature right now.",
  reason,
  details,
}: Props) {
  const router = useRouter();

  return (
    <div
      style={{
        width: "100%",
        borderRadius: 22,
        border: "1px solid rgba(255,180,80,0.22)",
        background: "rgba(255,180,80,0.06)",
        padding: 22,
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 900, color: "white" }}>{title}</div>

      <div style={{ marginTop: 10, color: "rgba(255,255,255,0.82)", fontSize: 16, lineHeight: 1.6 }}>
        {message}
      </div>

      {reason ? (
        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
            borderRadius: 14,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.86)",
            fontFamily: "ui-monospace, Menlo, monospace",
            fontSize: 13,
          }}
        >
          reason: {reason}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
        <button
          onClick={() => router.push("/plans")}
          style={{
            padding: "14px 18px",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.10)",
            color: "white",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          View Plans
        </button>

        <button
          onClick={() => router.push("/billing")}
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
          Open Billing
        </button>
      </div>

      {details ? (
        <div style={{ marginTop: 18 }}>
          <div style={{ color: "rgba(255,255,255,0.70)", fontWeight: 900, marginBottom: 8 }}>Debug</div>
          <pre
            style={{
              margin: 0,
              padding: 16,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.22)",
              color: "rgba(255,255,255,0.86)",
              whiteSpace: "pre-wrap",
              fontFamily: "ui-monospace, Menlo, monospace",
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}