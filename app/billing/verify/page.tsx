"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/app-shell";
import { Card } from "@/components/ui";
import { apiJson } from "@/lib/api";

type VerifyResp = {
  ok?: boolean;
  message?: string;
  status?: string;
  reference?: string;
  plan_code?: string;
  amount_kobo?: number;
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

        const resp = await apiJson<VerifyResp>(
          `/billing/verify?reference=${encodeURIComponent(reference)}`,
          {
            method: "GET",
          }
        );

        if (!active) return;

        setResult(resp);

        if (resp?.ok && resp?.redirect_to) {
          window.location.replace(resp.redirect_to);
          return;
        }

        if (resp?.ok) {
          setTimeout(() => {
            router.replace("/dashboard?billing=verified");
          }, 1500);
        }
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Unable to verify payment right now.");
      } finally {
        if (active) setLoading(false);
      }
    }

    run();

    return () => {
      active = false;
    };
  }, [reference, router]);

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
            We are confirming your Paystack payment and updating your
            subscription.
          </p>
        </div>

        {loading ? (
          <StatusCard
            title="Verifying payment..."
            message="Please wait while we confirm your payment reference and activate your plan."
            tone="neutral"
          />
        ) : error ? (
          <StatusCard
            title="Verification failed"
            message={error}
            tone="error"
          />
        ) : result?.ok ? (
          <StatusCard
            title="Payment verified successfully"
            message="Your subscription has been updated successfully. You will be redirected to your dashboard shortly."
            tone="success"
          />
        ) : (
          <StatusCard
            title="Verification incomplete"
            message={
              result?.message ||
              "We could not confirm the payment yet. Please check Billing or try again shortly."
            }
            tone="warning"
          />
        )}

        <Card
          style={{
            padding: 24,
            display: "grid",
            gap: 12,
          }}
        >
          <div>
            <strong>Reference:</strong>{" "}
            <span>{reference || "Not available"}</span>
          </div>

          {result?.status ? (
            <div>
              <strong>Status:</strong> <span>{result.status}</span>
            </div>
          ) : null}

          {result?.plan_code ? (
            <div>
              <strong>Plan:</strong> <span>{result.plan_code}</span>
            </div>
          ) : null}

          {typeof result?.amount_kobo === "number" ? (
            <div>
              <strong>Amount:</strong>{" "}
              <span>₦{(result.amount_kobo / 100).toLocaleString()}</span>
            </div>
          ) : null}
        </Card>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/billing"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 44,
              padding: "0 18px",
              borderRadius: 12,
              textDecoration: "none",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
              fontWeight: 700,
            }}
          >
            Go to Billing
          </Link>

          <Link
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 44,
              padding: "0 18px",
              borderRadius: 12,
              textDecoration: "none",
              background: "var(--primary)",
              color: "var(--primary-foreground)",
              fontWeight: 700,
            }}
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

function VerifyPageFallback() {
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
            Preparing payment verification...
          </p>
        </div>

        <StatusCard
          title="Loading verification details..."
          message="Please wait while we prepare your payment verification page."
          tone="neutral"
        />
      </div>
    </AppShell>
  );
}

export default function BillingVerifyPage() {
  return (
    <Suspense fallback={<VerifyPageFallback />}>
      <VerifyPageContent />
    </Suspense>
  );
}