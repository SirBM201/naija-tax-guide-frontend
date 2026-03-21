"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { apiJson, isApiError } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";

type VerifyResp = {
  ok?: boolean;
  paid?: boolean;
  reference?: string;
  subscription?: unknown;
  plan?: unknown;
  status?: string;
  data?: unknown;
  error?: string;
  root_cause?: string;
};

function BillingVerifyPageContent() {
  const router = useRouter();
  const sp = useSearchParams();

  const [busy, setBusy] = useState(true);
  const [status, setStatus] = useState("Verifying payment...");
  const [raw, setRaw] = useState<unknown>(null);
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
      } catch (err: unknown) {
        if (isApiError(err)) {
          setStatus(`Verification failed (${err.status})`);
          setRaw(err.data ?? null);
        } else {
          setStatus("Verification failed");
          setRaw(err instanceof Error ? err.message : String(err));
        }
      } finally {
        setBusy(false);
      }
    };

    void run();
  }, [sp]);

  useEffect(() => {
    const paid = Boolean((raw as VerifyResp | null)?.ok && (raw as VerifyResp | null)?.paid);

    if (!paid || redirectedRef.current) return;
    if (countdown === null) return;

    if (countdown <= 0) {
      redirectedRef.current = true;
      const reference = encodeURIComponent(
        String((raw as VerifyResp | null)?.reference || "")
      );
      router.push(`/dashboard?paid=1&reference=${reference}`);
      return;
    }

    const id = window.setTimeout(() => {
      setCountdown((c) => (c === null ? null : c - 1));
    }, 1000);

    return () => window.clearTimeout(id);
  }, [countdown, raw, router]);

  const paid = Boolean((raw as VerifyResp | null)?.ok && (raw as VerifyResp | null)?.paid);

  const goDashboardNow = () => {
    const rawRef = raw as VerifyResp | null;
    const reference = encodeURIComponent(
      String(rawRef?.reference || sp?.get("reference") || "")
    );
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
            disabled={busy}
            style={{
              padding: "14px 18px",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
              fontWeight: 900,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.7 : 1,
            }}
          >
            Open Billing
          </button>

          <button
            onClick={() => router.push("/plans")}
            disabled={busy}
            style={{
              padding: "14px 18px",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
              fontWeight: 900,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.7 : 1,
            }}
          >
            View Plans
          </button>
        </div>

        <div style={{ marginTop: 22 }}>
          <div style={{ color: "white", fontWeight: 900, marginBottom: 10 }}>
            Raw response (debug)
          </div>
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

function BillingVerifyFallback() {
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
          maxWidth: 560,
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          padding: 24,
          textAlign: "center",
        }}
      >
        Loading billing verification...
      </div>
    </div>
  );
}

export default function BillingVerifyPage() {
  return (
    <Suspense fallback={<BillingVerifyFallback />}>
      <BillingVerifyPageContent />
    </Suspense>
  );
}