"use client";

import React, { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { getStoredAuthToken } from "@/lib/auth-storage";

type VerifyResp = {
  ok?: boolean;
  paid?: boolean;
  status?: string;
  reference?: string;
  subscription?: unknown;
  subscription_summary?: unknown;
  error?: string;
  root_cause?: string;
};

export default function BillingVerifyPage() {
  const [info, setInfo] = useState("Preparing payment verification...");
  const token = getStoredAuthToken();

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function run() {
      const url = new URL(window.location.href);
      const reference = url.searchParams.get("reference");

      if (!reference) {
        setInfo("No payment reference was found. If you completed payment, contact support.");
        return;
      }

      setInfo(
        `Payment reference received: ${reference}\n\n` +
          `Now verifying with backend.`
      );

      try {
        const res = await apiGet<VerifyResp>(
          `/api/billing/verify?reference=${encodeURIComponent(reference)}`,
          token
        );

        if (cancelled) return;

        if (res?.ok && res?.paid) {
          setInfo(
            `✅ Payment verified successfully\n` +
              `Reference: ${reference}\n\n` +
              `Subscription activated.\n` +
              `Redirecting to Billing.`
          );
        } else if (res?.ok && res?.paid === false) {
          setInfo(
            `⚠️ Payment not successful yet\n` +
              `Reference: ${reference}\n` +
              `Status: ${res?.status || "unknown"}\n\n` +
              `If you already paid, it may take a short time.\n` +
              `Redirecting to Billing for re-check.`
          );
        } else {
          setInfo(
            `⚠️ Verification returned unexpected response\n` +
              `Reference: ${reference}\n\n` +
              `Redirecting to Billing.`
          );
        }
      } catch (e: any) {
        if (cancelled) return;
        setInfo(
          `❌ Verification failed\n` +
            `Reason: ${e?.message || "unknown_error"}\n\n` +
            `Redirecting to Billing so you can retry/check status.`
        );
      }

      timeoutId = setTimeout(() => {
        window.location.href = `/billing?reference=${encodeURIComponent(reference)}`;
      }, 1400);
    }

    run();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [token]);

  return (
    <section style={{ padding: "16px 10px", color: "#fff" }}>
      <h1 style={{ fontSize: 34, fontWeight: 900, marginBottom: 12 }}>
        Billing Verification
      </h1>

      <pre
        style={{
          marginTop: 10,
          padding: 14,
          borderRadius: 12,
          border: "1px solid #2a2a2a",
          background: "rgba(255,255,255,0.03)",
          whiteSpace: "pre-wrap",
          color: "#fff",
        }}
      >
        {info}
      </pre>

      <p style={{ marginTop: 12, color: "#cfcfcf" }}>
        If activation delays, Billing will help you verify the current state and refresh the workspace.
      </p>
    </section>
  );
}