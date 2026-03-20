"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiJson, isApiError } from "@/lib/api";

type VerifyResp = {
  ok?: boolean;
  paid?: boolean;
  reference?: string;
  status?: string;
  plan?: any;
  subscription?: any;
  error?: string;
  stage?: string;
  root_cause?: string;
  debug?: any;
};

export default function BillingSuccessPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const [status, setStatus] = useState("Verifying payment...");
  const [raw, setRaw] = useState<any>(null);

  useEffect(() => {
    const run = async () => {
      const reference = (sp?.get("reference") || "").trim();
      if (!reference) {
        setStatus("Missing reference in URL.");
        return;
      }

      try {
        const data = await apiJson<VerifyResp>(`/billing/verify?reference=${encodeURIComponent(reference)}&debug=1`, {
          method: "GET",
          timeoutMs: 25000,
        });

        setRaw(data);

        if (!data?.ok) {
          setStatus(`Verify failed (${data?.error || "unknown_error"})`);
          return;
        }

        if (!data?.paid) {
          setStatus(`Payment not completed yet (status: ${data?.status || "unknown"}).`);
          return;
        }

        setStatus("Payment verified ✅ Redirecting to dashboard...");
        setTimeout(() => router.push("/dashboard"), 800);
      } catch (err: any) {
        if (isApiError(err)) {
          setStatus(`Verify failed (${err.status})`);
          setRaw(err.data ?? null);
        } else {
          setStatus("Verify failed");
          setRaw(String(err?.message || err));
        }
      }
    };

    run();
  }, [router, sp]);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "rgba(7,10,18,1)", color: "white" }}>
      <div style={{ width: "100%", maxWidth: 820, borderRadius: 22, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)", padding: 22 }}>
        <div style={{ fontSize: 42, fontWeight: 950, letterSpacing: -1 }}>Billing Result</div>
        <div style={{ marginTop: 10, color: "rgba(255,255,255,0.75)" }}>{status}</div>

        <div style={{ marginTop: 18 }}>
          <div style={{ color: "rgba(255,255,255,0.70)", fontWeight: 900, marginBottom: 8 }}>Raw response (debug)</div>
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