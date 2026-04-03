"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/app-shell";
import { Card } from "@/components/ui";
import { apiJson } from "@/lib/api";

type VerifyResp = {
  ok?: boolean;
  paid?: boolean;
  applied?: boolean;
  activation_state?: string;
  message?: string;
  status?: string;
  reference?: string;
  plan_code?: string;
  redirect_to?: string;
};

function StatusCard({
  title,
  message,
  tone = "neutral",
}: {
  title: string;
  message: string;
  tone?: "neutral" | "success" | "warning" | "error";
}) {
  const borderColor =
    tone === "success"
      ? "rgba(34,197,94,0.35)"
      : tone === "warning"
      ? "rgba(245,158,11,0.35)"
      : tone === "error"
      ? "rgba(239,68,68,0.35)"
      : "var(--border)";

  const background =
    tone === "success"
      ? "rgba(34,197,94,0.08)"
      : tone === "warning"
      ? "rgba(245,158,11,0.08)"
      : tone === "error"
      ? "rgba(239,68,68,0.08)"
      : "var(--card)";

  return (
    <Card
      style={{
        padding: 24,
        border: `1px solid ${borderColor}`,
        background,
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: 10,
          fontSize: 22,
          fontWeight: 800,
        }}
      >
        {title}
      </h2>
      <p
        style={{
          margin: 0,
          color: "var(--muted-foreground)",
          lineHeight: 1.6,
        }}
      >
        {message}
      </p>
    </Card>
  );
}

function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const reference = useMemo(
    () => searchParams.get("reference") || searchParams.get("trxref") || "",
    [searchParams]
  );

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerifyResp | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function run() {
      if (!reference) {
        setError("Payment reference is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        let latest: VerifyResp | null = null;

        for (let attempt = 0; attempt < 6; attempt += 1) {
          const resp = await apiJson<VerifyResp>(
            `/billing/verify?reference=${encodeURIComponent(reference)}`,
            {
              method: "GET",
              timeoutMs: 20000,
            }
          );

          if (!active) return;
          latest = resp;
          setResult(resp);

          if (resp?.ok && resp?.redirect_to) {
            window.location.replace(resp.redirect_to);
            return;
          }

          if (resp?.ok && resp?.paid && resp?.applied) {
            setLoading(false);
            window.setTimeout(() => {
              router.replace("/dashboard?billing=verified");
            }, 1200);
            return;
          }

          if (!(resp?.ok && resp?.paid)) {
            break;
          }

          if (attempt < 5) {
            await new Promise((resolve) => window.setTimeout(resolve, 2000));
          }
        }

        if (!active) return;

        setResult(latest);
        if (latest?.ok && latest?.paid && !latest?.applied) {
          setError(latest.message || "Payment was verified, but subscription finalization is still pending.");
        }
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Unable to verify payment right now.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void run();

    return () => {
      active = false;
    };
  }, [reference, router]);

  const statusTone = loading
    ? "neutral"
    : error
    ? "warning"
    : result?.ok && result?.paid && result?.applied
    ? "success"
    : "warning";

  const statusTitle = loading
    ? "Verifying payment..."
    : error
    ? "Finalization pending"
    : result?.ok && result?.paid && result?.applied
    ? "Payment verified successfully"
    : "Verification incomplete";

  const statusMessage = loading
    ? "Please wait while we confirm your payment reference and finalize your subscription."
    : error ||
      result?.message ||
      "We could not confirm the payment yet. Please check Billing or try again shortly.";

  return (
    <AppShell>
      <div
        style={{
          display: "grid",
          gap: 20,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 32,
              fontWeight: 800,
            }}
          >
            Payment Verification
          </h1>
          <p
            style={{
              marginTop: 8,
              color: "var(--muted-foreground)",
              fontSize: 16,
            }}
          >
            We are confirming your Paystack payment and waiting for subscription finalization.
          </p>
        </div>

        <StatusCard title={statusTitle} message={statusMessage} tone={statusTone} />

        <Card
          style={{
            padding: 24,
            display: "grid",
            gap: 12,
          }}
        >
          <div>
            <strong>Reference:</strong> <span>{reference || "Not available"}</span>
          </div>

          {result?.status ? (
            <div>
              <strong>Status:</strong> <span>{result.status}</span>
            </div>
          ) : null}

          {result?.activation_state ? (
            <div>
              <strong>Activation State:</strong> <span>{result.activation_state}</span>
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
            <Link href="/billing">Open Billing</Link>
            <Link href="/dashboard">Open Dashboard</Link>
            <Link href="/support">Contact Support</Link>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

export default function BillingVerifyPage() {
  return (
    <Suspense fallback={<AppShell><StatusCard title="Loading..." message="Preparing billing verification page." /></AppShell>}>
      <VerifyPageContent />
    </Suspense>
  );
}
