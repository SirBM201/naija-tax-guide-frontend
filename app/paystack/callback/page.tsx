"use client";

import { useEffect, useState } from "react";
import { CONFIG } from "@/lib/config";
import { useAuth } from "@/lib/auth";

type VerifyResp = {
  ok?: boolean;
  paid?: boolean;
  status?: string;
  reference?: string;
  error?: string;
  message?: string;
  subscription?: any;
  plan?: any;
  data?: any;
};

async function apiGet<T>(path: string, token?: string | null): Promise<T> {
  const url = `${CONFIG.apiBase}${path}`;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { method: "GET", headers, cache: "no-store" });
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = json?.error || json?.message || `HTTP_${res.status}`;
    throw new Error(String(msg));
  }
  return json as T;
}

export default function PaystackCallbackPage() {
  const { token } = useAuth();
  const [info, setInfo] = useState<string>("Processing...");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const url = new URL(window.location.href);
      const reference = url.searchParams.get("reference");

      if (!reference) {
        setInfo("No reference found. If you completed payment, contact support.");
        return;
      }

      setInfo(
        `Payment reference received: ${reference}\n\n` +
          `Now verifying with backend...\n`
      );

      try {
        // ✅ IMPORTANT: call billing verify (this activates subscription immediately on success)
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
              `Redirecting to Dashboard...`
          );
        } else if (res?.ok && res?.paid === false) {
          setInfo(
            `⚠️ Payment not successful yet\n` +
              `Reference: ${reference}\n` +
              `Status: ${res?.status || "unknown"}\n\n` +
              `If you already paid, it may take a short time.\n` +
              `Redirecting to Dashboard to re-check...`
          );
        } else {
          setInfo(
            `⚠️ Verification returned unexpected response\n` +
              `Reference: ${reference}\n\n` +
              `Redirecting to Dashboard...`
          );
        }
      } catch (e: any) {
        if (cancelled) return;
        setInfo(
          `❌ Verification failed\n` +
            `Reason: ${e?.message || "unknown_error"}\n\n` +
            `Redirecting to Dashboard so you can retry/check status...`
        );
      }

      // Always go to dashboard (dashboard can show status + refresh)
      const t = setTimeout(() => {
        window.location.href = `/dashboard?reference=${encodeURIComponent(reference)}`;
      }, 1200);

      return () => clearTimeout(t);
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <section style={{ padding: "16px 10px", color: "#fff" }}>
      <h1 style={{ fontSize: 34, fontWeight: 900, marginBottom: 12 }}>
        Payment Callback
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
        If activation delays, Dashboard will auto-refresh for a short time.
      </p>
    </section>
  );
}