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

type VerifyState = "idle" | "checking" | "applied" | "paid_not_applied" | "not_paid" | "failed";

function statusCopy(state: VerifyState, response: VerifyResp | null, errorMessage: string | null) {
  if (state === "checking") {
    return {
      tone: "default" as const,
      title: "Confirming your payment",
      subtitle: "We are checking Paystack and updating your subscription. This usually completes within a few seconds.",
    };
  }

  if (state === "applied") {
    return {
      tone: "good" as const,
      title: "Payment confirmed",
      subtitle: "Your subscription has been applied. Open billing to confirm the current plan and credits on your account.",
    };
  }

  if (state === "paid_not_applied") {
    return {
      tone: "warn" as const,
      title: "Payment received, activation still pending",
      subtitle: response?.message || "Paystack confirmed the payment, but the subscription update did not complete yet. Use Refresh Billing or contact support with the payment reference.",
    };
  }

  if (state === "not_paid") {
    return {
      tone: "warn" as const,
      title: "Payment is not completed yet",
      subtitle: `Current Paystack status: ${response?.status || "unknown"}. If money was deducted, wait briefly and refresh this page before retrying payment.`,
    };
  }

  if (state === "failed") {
    return {
      tone: "danger" as const,
      title: "Could not confirm payment",
      subtitle: errorMessage || response?.error || "The payment verification request failed. Open billing and try Refresh Billing, or contact support with the reference.",
    };
  }

  return {
    tone: "default" as const,
    title: "Billing result",
    subtitle: "We are preparing your billing confirmation.",
  };
}

function BillingSuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { billing, subscription, refreshAll } = useWorkspaceState({ autoLoad: true });

  const reference = useMemo(() => (searchParams?.get("reference") || "").trim(), [searchParams]);
  const planHint = useMemo(() => (searchParams?.get("plan") || "").trim(), [searchParams]);

  const [state, setState] = useState<VerifyState>(reference ? "checking" : "failed");
  const [response, setResponse] = useState<VerifyResp | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    reference ? null : "Payment reference is missing from the return URL."
  );

  useEffect(() => {
    let cancelled = false;

    const verifyPayment = async () => {
      if (!reference) return;

      setState("checking");
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
            setState("checking");
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

  const visibleStatus = subscription?.status || billing?.status || response?.activation_state || response?.status || "Checking";

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
          subtitle="Use these details when checking your billing page or contacting support."
        >
          <CardsGrid min={180}>
            <MetricCard label="Payment Reference" value={reference || "Missing"} tone={reference ? "good" : "danger"} helper="Reference returned by Paystack." />
            <MetricCard label="Payment Status" value={response?.paid ? "Paid" : response?.status || "Checking"} tone={response?.paid ? "good" : state === "failed" ? "danger" : "warn"} helper="Current status from payment verification." />
            <MetricCard label="Activation" value={response?.applied ? "Applied" : state === "checking" ? "Checking" : "Not applied yet"} tone={response?.applied ? "good" : state === "paid_not_applied" ? "warn" : state === "failed" ? "danger" : "default"} helper="Whether the subscription update has been written to the account." />
            <MetricCard label="Visible Plan" value={activePlan} tone={response?.applied ? "good" : "default"} helper={`Visible account status: ${visibleStatus}`} />
          </CardsGrid>
        </WorkspaceSectionCard>

        {state === "paid_not_applied" || state === "failed" ? (
          <WorkspaceSectionCard
            title="Support details"
            subtitle="Share this concise payment record if the plan still does not activate after refreshing billing."
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
    <AppShell title="Billing Result" subtitle="Loading payment confirmation.">
      <SectionStack>
        <Banner
          tone="default"
          title="Loading billing result"
          subtitle="We are preparing the payment confirmation page."
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
