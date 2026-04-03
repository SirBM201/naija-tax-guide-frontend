"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import AppShell, {
  shellButtonPrimary,
  shellButtonSecondary,
} from "@/components/app-shell";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { Banner } from "@/components/ui";
import { CardsGrid, SectionStack, TwoColumnSection } from "@/components/page-layout";
import { useWorkspaceState } from "@/hooks/useWorkspaceState";

function labelStyle(): React.CSSProperties {
  return {
    margin: 0,
    fontSize: 15,
    color: "var(--text-muted)",
    lineHeight: 1.5,
  };
}

function valueStyle(): React.CSSProperties {
  return {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
    color: "var(--text)",
    lineHeight: 1.4,
  };
}

function bodyTextStyle(): React.CSSProperties {
  return {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.9,
    color: "var(--text)",
  };
}

function bulletListStyle(): React.CSSProperties {
  return {
    margin: 0,
    paddingLeft: 22,
    display: "grid",
    gap: 12,
    color: "var(--text)",
    lineHeight: 1.8,
    fontSize: 16,
  };
}

function actionButtonStyle(primary = false): React.CSSProperties {
  return {
    ...(primary ? shellButtonPrimary() : shellButtonSecondary()),
    width: "100%",
    justifyContent: "center",
  };
}

function formatDate(value?: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPlanName(value?: string | null) {
  if (!value) return "No visible plan";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function RefundPage() {
  const router = useRouter();
  const { billing, credits, usage } = useWorkspaceState({
    includeAccount: false,
    includeBilling: true,
    includeDebug: true,
  });

  const latestReference =
    billing?.last_payment_reference || billing?.payment_reference || "Not available";
  const currentPlan = billing?.plan_name || billing?.plan_code || "No visible plan";
  const creditBalance = Number(credits?.balance ?? 0);
  const usageToday = Number(usage?.count ?? 0);
  const expiresAt = billing?.expires_at || null;

  const supportLinks = useMemo(
    () => ({
      duplicate: `/support?issue=duplicate_charge&reference=${encodeURIComponent(latestReference)}`,
      wrongPlan: `/support?issue=wrong_plan&reference=${encodeURIComponent(latestReference)}`,
      activation: `/support?issue=activation_issue&reference=${encodeURIComponent(latestReference)}`,
      refund: `/support?issue=refund_request&reference=${encodeURIComponent(latestReference)}`,
    }),
    [latestReference]
  );

  return (
    <AppShell
      title="Refund Policy"
      subtitle="Review refund eligibility, duplicate-charge handling, and the fastest next step when a billing result looks wrong."
      actions={
        <>
          <button onClick={() => router.push("/billing")} style={shellButtonPrimary()}>
            Open Billing
          </button>
          <button onClick={() => router.push("/support")} style={shellButtonSecondary()}>
            Open Support
          </button>
        </>
      }
    >
      <SectionStack>
        <Banner
          tone="warn"
          title="Refunds are reviewed, not automatic"
          subtitle="Because Naija Tax Guide is a digital-access service, refund approval depends on payment evidence, activation state, plan outcome, and whether usable value has already been delivered."
        />

        <WorkspaceSectionCard
          title="Visible billing context"
          subtitle="This snapshot helps you confirm whether the visible account state matches the issue you want to report."
        >
          <CardsGrid min={220}>
            <div>
              <p style={labelStyle()}>Current plan</p>
              <p style={valueStyle()}>{formatPlanName(currentPlan)}</p>
            </div>
            <div>
              <p style={labelStyle()}>Latest reference</p>
              <p style={valueStyle()}>{latestReference}</p>
            </div>
            <div>
              <p style={labelStyle()}>Visible credits</p>
              <p style={valueStyle()}>{creditBalance}</p>
            </div>
            <div>
              <p style={labelStyle()}>Usage today</p>
              <p style={valueStyle()}>{usageToday}</p>
            </div>
            <div>
              <p style={labelStyle()}>Subscription expires</p>
              <p style={valueStyle()}>{formatDate(expiresAt)}</p>
            </div>
          </CardsGrid>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Fastest next step"
          subtitle="Choose the path that matches the billing problem instead of opening a vague support ticket."
        >
          <CardsGrid min={250}>
            <div>
              <p style={valueStyle()}>Duplicate charge</p>
              <p style={bodyTextStyle()}>
                Use this when the same card or account appears to have been billed more than once for the same intended payment.
              </p>
              <div style={{ marginTop: 16 }}>
                <button
                  onClick={() => router.push(supportLinks.duplicate)}
                  style={actionButtonStyle(true)}
                >
                  Report Duplicate Charge
                </button>
              </div>
            </div>

            <div>
              <p style={valueStyle()}>Wrong plan activated</p>
              <p style={bodyTextStyle()}>
                Use this when payment was successful but the visible plan does not match the one you intended to buy.
              </p>
              <div style={{ marginTop: 16 }}>
                <button
                  onClick={() => router.push(supportLinks.wrongPlan)}
                  style={actionButtonStyle(false)}
                >
                  Report Wrong Plan
                </button>
              </div>
            </div>

            <div>
              <p style={valueStyle()}>Payment successful but access failed</p>
              <p style={bodyTextStyle()}>
                Use this when the payment completed but activation, credits, or access did not reflect correctly.
              </p>
              <div style={{ marginTop: 16 }}>
                <button
                  onClick={() => router.push(supportLinks.activation)}
                  style={actionButtonStyle(false)}
                >
                  Report Activation Issue
                </button>
              </div>
            </div>

            <div>
              <p style={valueStyle()}>Refund review request</p>
              <p style={bodyTextStyle()}>
                Use this when you believe the transaction falls inside the refund-review rules on this page.
              </p>
              <div style={{ marginTop: 16 }}>
                <button
                  onClick={() => router.push(supportLinks.refund)}
                  style={actionButtonStyle(false)}
                >
                  Start Refund Review
                </button>
              </div>
            </div>
          </CardsGrid>
        </WorkspaceSectionCard>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 24,
          }}
        >
          <WorkspaceSectionCard
            title="Situations that may qualify for refund review"
            subtitle="These are review scenarios, not guaranteed approvals."
          >
            <ul style={bulletListStyle()}>
              <li>Duplicate payments or duplicate billing for the same intended service item.</li>
              <li>Technical activation failure after a successful payment.</li>
              <li>Unauthorized transaction concerns, subject to investigation.</li>
              <li>Clear platform-side billing or processing error that blocked the intended outcome.</li>
            </ul>
          </WorkspaceSectionCard>

          <WorkspaceSectionCard
            title="Situations generally not refundable"
            subtitle="These usually fail refund review once value has already been consumed correctly."
          >
            <ul style={bulletListStyle()}>
              <li>Used subscription time or already-consumed access window.</li>
              <li>Correct plan activation followed by change of mind.</li>
              <li>Requests where the purchased service was delivered as described.</li>
              <li>Refund claims made only because a different plan would have been preferred later.</li>
            </ul>
          </WorkspaceSectionCard>
        </div>

        <WorkspaceSectionCard
          title="Refund review window"
          subtitle="Requests should be made quickly while payment evidence is still easy to confirm."
        >
          <p style={bodyTextStyle()}>
            Eligible refund-related concerns should normally be raised within <strong>3 days of payment</strong>. Later requests may still be reviewed in unusual cases, but approval becomes harder when billing evidence, activation state, or provider-side timing can no longer be confirmed clearly.
          </p>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Before you contact support"
          subtitle="These checks help reduce back-and-forth and speed up review."
        >
          <ul style={bulletListStyle()}>
            <li>Confirm the latest visible payment reference matches the transaction you are reporting.</li>
            <li>Check whether the visible plan and credit balance already updated before opening a new refund-related ticket.</li>
            <li>Use the issue-specific support buttons above so billing context is carried into the support flow.</li>
            <li>For duplicate-charge concerns, mention both references if more than one payment was captured.</li>
          </ul>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
