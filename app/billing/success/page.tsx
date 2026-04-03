"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiJson, isApiError } from "@/lib/api";

type VerifyResp = {
  ok?: boolean;
  paid?: boolean;
  applied?: boolean;
  reference?: string;
  status?: string;
  activation_state?: string;
  plan?: unknown;
  subscription?: unknown;
  error?: string;
  stage?: string;
  root_cause?: string;
  debug?: unknown;
  message?: string;
};

function BillingSuccessPageContent() {
  const router = useRouter();
  const sp = useSearchParams();

  const [status, setStatus] = useState("Verifying payment...");
  const [raw, setRaw] = useState<unknown>(null);

  useEffect(() => {
    const run = async () => {
      const reference = (sp?.get("reference") || "").trim();
      if (!reference) {
        setStatus("Missing reference in URL.");
        return;
      }

      try {
        let latest: VerifyResp | null = null;

        for (let attempt = 0; attempt < 6; attempt += 1) {
          const data = await apiJson<VerifyResp>(
            `/billing/verify?reference=${encodeURIComponent(reference)}&debug=1`,
            {
              method: "GET",
              timeoutMs: 25000,
            }
          );

          latest = data;
          setRaw(data);

          if (!data?.ok) {
            setStatus(`Verify failed (${data?.error || "unknown_error"})`);
            return;
          }

          if (!data?.paid) {
            setStatus(`Payment not completed yet (status: ${data?.status || "unknown"}).`);
            return;
          }

          if (data?.applied) {
            setStatus("Payment verified and subscription applied ✅ Redirecting to dashboard...");
            window.setTimeout(() => router.push("/dashboard?billing=verified"), 800);
            return;
          }

          setStatus(data?.message || "Payment verified. Waiting for webhook finalization...");

          if (attempt < 5) {
            await new Promise((resolve) => window.setTimeout(resolve, 2000));
          }
        }

        setRaw(latest);
      } catch (err: unknown) {
        if (isApiError(err)) {
          setStatus(`Verify failed (${err.status})`);
          setRaw(err.data ?? null);
        } else {
          setStatus("Verify failed");
          setRaw(err instanceof Error ? err.message : String(err));
        }
      }
    };

    void run();
  }, [router, sp]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "rgba(7,10,18,1)",
        color: "white",
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
        <div style={{ fontSize: 42, fontWeight: 950, letterSpacing: -1 }}>
          Billing Result
        </div>
        <div style={{ marginTop: 10, color: "rgba(255,255,255,0.75)" }}>{status}</div>

        <div style={{ marginTop: 18 }}>
          <div
            style={{
              color: "rgba(255,255,255,0.70)",
              fontWeight: 900,
              marginBottom: 8,
            }}
          >
            Raw response (debug)
          </div>
          <pre
            style={{
              margin: 0,
              padding: 16,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.25)",
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

function BillingSuccessFallback() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "rgba(7,10,18,1)",
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
        Loading billing result...
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={<BillingSuccessFallback />}>
      <BillingSuccessPageContent />
    </Suspense>
  );
}
