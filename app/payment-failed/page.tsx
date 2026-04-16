"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AppShell, {
  shellButtonPrimary,
  shellButtonSecondary,
} from "@/components/app-shell";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { Banner } from "@/components/ui";
import { SectionStack } from "@/components/page-layout";

function bodyStyle(): React.CSSProperties {
  return {
    display: "grid",
    gap: 16,
    color: "var(--text)",
    fontSize: 15,
    lineHeight: 1.85,
    minWidth: 0,
  };
}

function actionGridStyle(): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 12,
    alignItems: "stretch",
    width: "100%",
  };
}

function infoGridStyle(): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
    width: "100%",
  };
}

function infoCardStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 18,
    background: "var(--surface)",
    padding: 18,
    display: "grid",
    gap: 8,
    minWidth: 0,
  };
}

function labelStyle(): React.CSSProperties {
  return {
    fontSize: 12,
    fontWeight: 800,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: 0.45,
    margin: 0,
    wordBreak: "break-word",
  };
}

function valueStyle(): React.CSSProperties {
  return {
    fontSize: "clamp(19px, 4vw, 22px)",
    fontWeight: 900,
    color: "var(--text)",
    margin: 0,
    lineHeight: 1.2,
    wordBreak: "break-word",
    overflowWrap: "anywhere",
  };
}

function helperStyle(): React.CSSProperties {
  return {
    fontSize: 14,
    color: "var(--text-muted)",
    lineHeight: 1.7,
    margin: 0,
    wordBreak: "break-word",
    overflowWrap: "anywhere",
  };
}

function bulletListStyle(): React.CSSProperties {
  return {
    margin: 0,
    paddingLeft: 20,
    display: "grid",
    gap: 12,
    lineHeight: 1.8,
    fontSize: 15,
  };
}

export default function PaymentFailedPage() {
  const router = useRouter();

  return (
    <AppShell
      title="Payment Failed"
      subtitle="Your payment could not be completed. This may be caused by authorization failure, provider decline, interruption during checkout, or temporary billing-side issues."
      actions={
        <>
          <button onClick={() => router.push("/billing")} style={shellButtonPrimary()}>
            Try Billing Again
          </button>
          <button onClick={() => router.push("/dashboard")} style={shellButtonSecondary()}>
            Back to Dashboard
          </button>
        </>
      }
    >
      <SectionStack>
        <Banner
          tone="danger"
          title="Payment was not completed"
          subtitle="No successful billing result has been confirmed from this attempt. Review your billing flow before retrying."
        />

        <WorkspaceSectionCard
          title="What this usually means"
          subtitle="A failed payment outcome may be caused by provider decline, interruption, authorization mismatch, or temporary processing issues."
        >
          <div style={bodyStyle()}>
            <div style={infoGridStyle()}>
              <div style={infoCardStyle()}>
                <p style={labelStyle()}>Possible cause</p>
                <p style={valueStyle()}>Payment provider decline</p>
                <p style={helperStyle()}>
                  The card, account, or processor may have rejected the transaction attempt.
                </p>
              </div>

              <div style={infoCardStyle()}>
                <p style={labelStyle()}>Another cause</p>
                <p style={valueStyle()}>Interrupted checkout</p>
                <p style={helperStyle()}>
                  The billing flow may have been interrupted before completion or confirmation.
                </p>
              </div>

              <div style={infoCardStyle()}>
                <p style={labelStyle()}>Recommended action</p>
                <p style={valueStyle()}>Review before retry</p>
                <p style={helperStyle()}>
                  Go back to Billing and confirm the payment method, plan choice, and connection stability before trying again.
                </p>
              </div>
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Recommended next actions"
          subtitle="Use a controlled route instead of repeatedly retrying the same failed step without review."
        >
          <div style={actionGridStyle()}>
            <button onClick={() => router.push("/billing")} style={shellButtonPrimary()}>
              Billing
            </button>
            <button onClick={() => router.push("/plans")} style={shellButtonSecondary()}>
              Plans
            </button>
            <button onClick={() => router.push("/help")} style={shellButtonSecondary()}>
              Help
            </button>
            <button onClick={() => router.push("/support")} style={shellButtonSecondary()}>
              Support
            </button>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Before trying payment again"
          subtitle="A careful retry is better than repeated blind retries."
        >
          <div style={bodyStyle()}>
            <ul style={bulletListStyle()}>
              <li>Confirm that the selected plan is the one you actually want.</li>
              <li>Check that the payment method is valid and authorized for the transaction.</li>
              <li>Make sure the internet connection or checkout session did not fail mid-process.</li>
              <li>Review whether another payment attempt may already be pending before retrying immediately.</li>
            </ul>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="When to contact support"
          subtitle="Support is appropriate if the failed state seems incorrect or the billing result is unclear."
        >
          <div style={bodyStyle()}>
            <ul style={bulletListStyle()}>
              <li>You believe money was deducted even though the page shows failure.</li>
              <li>You retried carefully and the same failure keeps happening.</li>
              <li>You suspect a processor issue, duplicate attempt, or inconsistent billing result.</li>
              <li>You need help confirming whether the payment actually failed, is pending, or partially processed.</li>
            </ul>
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
