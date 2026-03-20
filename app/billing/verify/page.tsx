"use client";

import React, { useEffect, useRef, useState } from "react";
import { apiJson, isApiError } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";

type VerifyResp = {
  ok?: boolean;
  paid?: boolean;
  reference?: string;
  subscription?: any;
  plan?: any;
  status?: string;
  data?: any;
  error?: string;
  root_cause?: string;
};

export default function BillingVerifyPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const [busy, setBusy] = useState(true);
  const [status, setStatus] = useState("Verifying payment...");
  const [raw, setRaw] = useState<any>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const redirectedRef = useRef(false);

  useEffect(() => {
    const run = async () => {
      const reference = (sp?.get("reference") || "").trim();

      if (!reference) {
        setStatus("Missing payment reference.");
        setBusy(false);
        return;
      }

      try {
        const data = await apiJson<VerifyResp>("/billing/verify", {
          method: "GET",
          timeoutMs: 30000,
          useAuthToken: false,
          query: { reference },
        });

        setRaw(data);

        if (data?.ok && data?.paid) {
          setStatus("Payment verified successfully. Redirecting to dashboard...");
          setCountdown(4);
          return;
        }

        if (data?.ok && !data?.paid) {
          setStatus(`Payment not completed (${data?.status || "unknown_status"}).`);
          return;
        }

        setStatus(`Verification failed (${data?.error || "unknown_error"})`);
      } catch (err: any) {
        if (isApiError(err)) {
          setStatus(`Verification failed (${err.status})`);
          setRaw(err.data ?? null);
        } else {
          setStatus("Verification failed");
          setRaw(String(err?.message || err));
        }
      } finally {
        setBusy(false);
      }
    };

    run();
  }, [sp]);

  useEffect(() => {
    if (!raw?.ok || !raw?.paid || redirectedRef.current) return;
    if (countdown === null) return;

    if (countdown <= 0) {
      redirectedRef.current = true;
      const reference = encodeURIComponent(String(raw?.reference || ""));
      router.push(`/dashboard?paid=1&reference=${reference}`);
      return;
    }

    const id = window.setTimeout(() => {
      setCountdown((c) => (c === null ? null : c - 1));
    }, 1000);

    return () => window.clearTimeout(id);
  }, [countdown, raw, router]);

  const paid = Boolean(raw?.ok && raw?.paid);

  const goDashboardNow = () => {
    const reference = encodeURIComponent(String(raw?.reference || sp?.get("reference") || ""));
    router.push(`/dashboard?paid=1&reference=${reference}`);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(900px 700px at 20% 10%, rgba(120,140,255,0.22), transparent 60%), rgba(7,10,18,1)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 820,
          borderRadius: 22,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.04)",
          padding: 22,
        }}
      >
        <div style={{ fontSize: 42, fontWeight: 950, color: "white", letterSpacing: -1 }}>
          Billing Verification
        </div>

        <div style={{ marginTop: 8, color: "rgba(255,255,255,0.72)" }}>{status}</div>

        {paid ? (
          <div
            style={{
              marginTop: 18,
              padding: "14px 16px",
              borderRadius: 16,
              border: "1px solid rgba(80,220,140,0.24)",
              background: "rgba(80,220,140,0.08)",
              color: "white",
            }}
          >
            <div style={{ fontWeight: 900 }}>Subscription has been activated successfully.</div>
            <div style={{ marginTop: 8, color: "rgba(255,255,255,0.88)" }}>
              {countdown !== null
                ? `You will be redirected to the dashboard in ${countdown} second${countdown === 1 ? "" : "s"}.`
                : "Preparing redirect..."}
            </div>
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
          {paid ? (
            <button
              onClick={goDashboardNow}
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
              Go to Dashboard Now
            </button>
          ) : null}

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

          <button
            onClick={() => router.push("/plans")}
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
            View Plans
          </button>
        </div>

        <div style={{ marginTop: 22 }}>
          <div style={{ color: "white", fontWeight: 900, marginBottom: 10 }}>Raw response (debug)</div>
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
            {JSON.stringify(raw, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}