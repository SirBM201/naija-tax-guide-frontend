"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiJson, isApiError } from "@/lib/api";
import AppShell, {
  shellButtonPrimary,
  shellButtonSecondary,
} from "@/components/app-shell";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { Banner, MetricCard } from "@/components/ui";
import { CardsGrid, SectionStack } from "@/components/page-layout";
import { useWorkspaceState } from "@/hooks/useWorkspaceState";

type VerifyResp = {
  ok?: boolean;
  paid?: boolean;
  applied?: boolean;
  reference?: string;
  status?: string;
  activation_state?: string;
  plan_code?: string | null;
  payment_type?: string | null;
  error?: string;
  message?: string;
};

type VerifyState = "idle" | "confirming" | "applied" | "paid_not_applied" | "not_paid" | "failed";

function statusCopy(state: VerifyState, response: VerifyResp | null, errorMessage: string | null) {
  if (state === "confirming") {
    return {
      tone: "default" as const,
      title: "Confirming your payment",
      subtitle: "The payment reference is being verified with Paystack. Subscription access changes only after successful confirmation and account activation.",
    };
  }

  if (state === "applied") {
    return {
      tone: "good" as const,
      title: "Payment confirmed and access updated",
      subtitle: "Your subscription has been applied. Open Billing to confirm the current plan, expiry, and Usage Credits now visible on your account.",
    };
  }

  if (state === "paid_not_applied") {
    return {
      tone: "warn" as const,
      title: "Payment confirmed, activation needs review",
      subtitle: response?.message || "Paystack confirmed the payment, but the subscription update has not completed. Refresh Billing, then contact Support with the reference if access still does not update.",
    };
  }

  if (state === "not_paid") {
    return {
      tone: "warn" as const,
      title: "Payment is not confirmed yet",
      subtitle: `Current Paystack status: ${response?.status || "unknown"}. If money was deducted, do not repeat large payments immediately. Refresh Billing and keep the reference for support review.`,
    };
  }

  if (state === "failed") {
    return {
      tone: "danger" as const,
      title: "Payment could not be confirmed",
      subtitle: errorMessage || response?.error || "The payment verification request failed. Open Billing and use Support with the reference if money was deducted.",
    };
  }

  return {
    tone: "default" as const,
    title: "Billing result",
    subtitle: "Payment confirmation will appear here when a valid reference is available.",
  };
}

function supportPath(reference: string, state: VerifyState) {
  const params = new URLSearchParams();
  params.set("intent", state === "paid_not_applied" ? "activation_issue" : "billing_payment_review");
  if (reference) params.set("reference", reference);
  return `/support?${params.toString()}`;
}

function BillingSuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { billing, subscription, refreshAll } = useWorkspaceState({ autoLoad: true });

  const reference = useMemo(() => (searchParams?.get("reference") || "").trim(), [searchParams]);
  const planHint = useMemo(() => (searchParams?.get("plan") || "").trim(), [searchParams]);

  const [state, setState] = useState<VerifyState>(reference ? "confirming" : "failed");
  const [response, setResponse] = useState<VerifyResp | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    reference ? null : "Payment reference is missing from the return URL."
  );

  useEffect(() => {
    let cancelled = false;

    const verifyPayment = async () => {
      if (!reference) return;

      setState("confirming");
      setErrorMessage(null);

      for (let attempt = 0; attempt < 6; attempt += 1) {
        try {
          const data = await apiJson<VerifyResp>("/billing/verify", {
            method: "GET",
            query: { reference, plan: planHint || undefined },
            timeoutMs: 25000,
            useAuthToken: false,
          });

          if (cancelled) return;
          setResponse(data);

          if (!data?.ok) {
            setState("failed");
            setErrorMessage(data?.message || data?.error || "Payment verification failed.");
            return;
          }

          if (!data?.paid) {
            setState("not_paid");
            return;
          }

          if (data?.applied) {
            setState("applied");
            void refreshAll();
            return;
          }

          if (attempt < 5) {
            setState("confirming");
            await new Promise((resolve) => window.setTimeout(resolve, 2000));
            continue;
          }

          setState("paid_not_applied");
          void refreshAll();
          return;
        } catch (error) {
          if (cancelled) return;

          if (attempt < 5) {
            await new Promise((resolve) => window.setTimeout(resolve, 2000));
            continue;
          }

          setState("failed");
          if (isApiError(error)) {
            setErrorMessage(error.message || "Payment verification failed.");
          } else {
            setErrorMessage(error instanceof Error ? error.message : "Payment verification failed.");
          }
          return;
        }
      }
    };

    void verifyPayment();

    return () => {
      cancelled = true;
    };
  }, [reference, planHint, refreshAll]);

  const copy = statusCopy(state, response, errorMessage);
  const activePlan =
    subscription?.plan_name ||
    billing?.plan_name ||
    subscription?.plan_code ||
    billing?.plan_code ||
    response?.plan_code ||
    planHint ||
    "Not currently visible";

  const visibleStatus = subscription?.status || billing?.status || response?.activation_state || response?.status || "Confirming";
  const actionSupportPath = supportPath(reference, state);

  return (
    <AppShell
      title="Billing Result"
      subtitle="Confirm payment status and make sure the selected subscription is visible on your account."
      actions={
        <>
          <button
            onClick={() => {
              void refreshAll();
              router.push("/billing");
            }}
            style={shellButtonPrimary()}
          >
            Open Billing
          </button>
          <button onClick={() => router.push(actionSupportPath)} style={shellButtonSecondary()}>
            Support
          </button>
          <button onClick={() => router.push("/plans")} style={shellButtonSecondary()}>
            Manage Plans
          </button>
        </>
      }
    >
      <SectionStack>
        <Banner tone={copy.tone} title={copy.title} subtitle={copy.subtitle} />

        <WorkspaceSectionCard
          title="Payment confirmation"
          subtitle="Use these details when checking Billing or contacting Support."
        >
          <CardsGrid min={180}>
            <MetricCard label="Payment Reference" value={reference || "Missing"} tone={reference ? "good" : "danger"} helper="Reference returned by Paystack." />
            <MetricCard label="Payment Status" value={response?.paid ? "Confirmed paid" : response?.status || "Confirming"} tone={response?.paid ? "good" : state === "failed" ? "danger" : "warn"} helper="Current status from payment verification." />
            <MetricCard label="Activation" value={response?.applied ? "Applied" : state === "confirming" ? "Confirming" : "Not applied yet"} tone={response?.applied ? "good" : state === "paid_not_applied" ? "warn" : state === "failed" ? "danger" : "default"} helper="Whether the subscription update has been written to the account." />
            <MetricCard label="Visible Plan" value={activePlan} tone={response?.applied ? "good" : "default"} helper={`Visible account status: ${visibleStatus}`} />
          </CardsGrid>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="What to do next"
          subtitle="Use the route that matches the payment result."
        >
          <CardsGrid min={220}>
            <div style={{ display: "grid", gap: 10, border: "1px solid var(--border)", borderRadius: 18, background: "var(--surface)", padding: 16 }}>
              <strong style={{ color: "var(--text)", fontSize: 17 }}>Payment confirmed</strong>
              <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.7 }}>Open Billing to confirm plan, expiry date, receipt reference, and Usage Credits.</p>
              <button type="button" onClick={() => router.push("/billing")} style={shellButtonPrimary()}>Open Billing</button>
            </div>
            <div style={{ display: "grid", gap: 10, border: "1px solid var(--border)", borderRadius: 18, background: "var(--surface)", padding: 16 }}>
              <strong style={{ color: "var(--text)", fontSize: 17 }}>Payment not reflected</strong>
              <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.7 }}>Contact Support with the reference, selected plan, debit evidence, and the result shown on this page.</p>
              <button type="button" onClick={() => router.push(actionSupportPath)} style={shellButtonSecondary()}>Open Support</button>
            </div>
            <div style={{ display: "grid", gap: 10, border: "1px solid var(--border)", borderRadius: 18, background: "var(--surface)", padding: 16 }}>
              <strong style={{ color: "var(--text)", fontSize: 17 }}>Refund concern</strong>
              <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.7 }}>Use the Refund Policy if you see duplicate charges, failed activation, or another billing issue that needs review.</p>
              <button type="button" onClick={() => router.push("/refund")} style={shellButtonSecondary()}>Refund Policy</button>
            </div>
          </CardsGrid>
        </WorkspaceSectionCard>

        {state === "paid_not_applied" || state === "failed" ? (
          <WorkspaceSectionCard
            title="Support details"
            subtitle="Share this concise payment record if the plan still does not activate after refreshing Billing."
          >
            <div
              style={{
                display: "grid",
                gap: 10,
                color: "var(--text)",
                fontSize: 15,
                lineHeight: 1.7,
                overflowWrap: "anywhere",
              }}
            >
              <div><strong>Reference:</strong> {reference || "Missing"}</div>
              <div><strong>Plan:</strong> {response?.plan_code || planHint || "Not currently visible"}</div>
              <div><strong>Verification:</strong> {response?.activation_state || response?.status || state}</div>
              <div><strong>Message:</strong> {errorMessage || response?.message || "Payment confirmed but activation is still pending."}</div>
            </div>
          </WorkspaceSectionCard>
        ) : null}
      </SectionStack>
    </AppShell>
  );
}

function BillingSuccessFallback() {
  return (
    <AppShell title="Billing Result" subtitle="Preparing payment confirmation.">
      <SectionStack>
        <Banner
          tone="default"
          title="Preparing billing result"
          subtitle="The payment confirmation page is loading."
        />
      </SectionStack>
    </AppShell>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={<BillingSuccessFallback />}>
      <BillingSuccessPageContent />
    </Suspense>
  );
}
