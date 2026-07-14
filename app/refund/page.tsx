"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AppShell, {
  shellButtonPrimary,
  shellButtonSecondary,
} from "@/components/app-shell";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { Banner } from "@/components/ui";
import { CardsGrid, SectionStack } from "@/components/page-layout";
import { useAuth } from "@/lib/auth";

function valueStyle(): React.CSSProperties {
  return {
    margin: 0,
    fontSize: "clamp(18px, 4.5vw, 20px)",
    fontWeight: 800,
    color: "var(--text)",
    lineHeight: 1.35,
    wordBreak: "break-word",
    overflowWrap: "anywhere",
  };
}

function bodyTextStyle(): React.CSSProperties {
  return {
    margin: 0,
    fontSize: "clamp(15px, 2.7vw, 16px)",
    lineHeight: 1.85,
    color: "var(--text)",
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
    color: "var(--text)",
    lineHeight: 1.8,
    fontSize: "clamp(15px, 2.6vw, 16px)",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
  };
}

function actionButtonStyle(primary = false): React.CSSProperties {
  return {
    ...(primary ? shellButtonPrimary() : shellButtonSecondary()),
    width: "100%",
    justifyContent: "center",
  };
}

function cardTextBlockStyle(): React.CSSProperties {
  return {
    display: "grid",
    gap: 12,
    minWidth: 0,
  };
}

const reviewItems = [
  "Duplicate payments or duplicate billing for the same intended service item.",
  "Technical activation failure after a successful payment.",
  "Money debited but Paystack or the platform did not confirm the intended outcome.",
  "Clear platform-side billing or processing error that blocked the purchased access.",
];

const generallyNotRefundable = [
  "Used subscription time or an already-consumed access window.",
  "Correct plan activation followed by change of mind.",
  "Requests where the purchased service was delivered as described.",
  "Top-up credits that were successfully delivered and then consumed.",
];

export default function RefundPage() {
  const router = useRouter();
  const { authReady, hasSession } = useAuth();
  const isLoggedIn = authReady && hasSession;

  function supportPath(intent: string) {
    const next = `/support?intent=${encodeURIComponent(intent)}`;
    return isLoggedIn ? next : `/login?next=${encodeURIComponent(next)}`;
  }

  function billingPath() {
    return isLoggedIn ? "/billing" : `/login?next=${encodeURIComponent("/billing")}`;
  }

  return (
    <AppShell
      title="Refund Policy"
      subtitle="Review refund eligibility, duplicate-charge handling, failed activation steps, and the fastest route when a billing result looks wrong."
      actions={
        <>
          <button onClick={() => router.push(billingPath())} style={shellButtonPrimary()}>
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
          subtitle="Because Naija Tax Guide is a digital-access service, refund approval depends on payment evidence, activation state, plan outcome, credit usage, and whether usable value has already been delivered."
        />

        <WorkspaceSectionCard
          title="Before you request a refund review"
          subtitle="Account-specific billing questions need a payment reference and a logged-in support trail."
        >
          <p style={bodyTextStyle()}>
            Review the visible plan, payment reference, activation state, credit balance, and receipt details in Billing where available. If money was debited but access did not update, open a support ticket with the Paystack reference, amount, date, plan selected, and the result you saw after checkout.
          </p>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Fastest next step"
          subtitle="Choose the path that matches the billing problem instead of opening a vague support ticket."
        >
          <CardsGrid min={220}>
            <div style={cardTextBlockStyle()}>
              <p style={valueStyle()}>Duplicate charge</p>
              <p style={bodyTextStyle()}>
                Use this when the same card, bank account, or payment route appears to have been billed more than once for the same intended payment.
              </p>
              <button onClick={() => router.push(supportPath("duplicate_charge"))} style={actionButtonStyle(true)}>
                Report Duplicate Charge
              </button>
            </div>

            <div style={cardTextBlockStyle()}>
              <p style={valueStyle()}>Wrong plan activated</p>
              <p style={bodyTextStyle()}>
                Use this when payment was successful but the visible plan does not match the one you intended to buy.
              </p>
              <button onClick={() => router.push(supportPath("wrong_plan"))} style={actionButtonStyle(false)}>
                Report Wrong Plan
              </button>
            </div>

            <div style={cardTextBlockStyle()}>
              <p style={valueStyle()}>Payment successful but access failed</p>
              <p style={bodyTextStyle()}>
                Use this when checkout completed but activation, credits, renewal, or access did not reflect correctly.
              </p>
              <button onClick={() => router.push(supportPath("activation_issue"))} style={actionButtonStyle(false)}>
                Report Activation Issue
              </button>
            </div>

            <div style={cardTextBlockStyle()}>
              <p style={valueStyle()}>Refund review request</p>
              <p style={bodyTextStyle()}>
                Use this when you believe the transaction falls inside the refund-review rules on this page.
              </p>
              <button onClick={() => router.push(supportPath("refund_review"))} style={actionButtonStyle(false)}>
                Start Refund Review
              </button>
            </div>
          </CardsGrid>
        </WorkspaceSectionCard>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
            gap: 20,
          }}
        >
          <WorkspaceSectionCard
            title="Situations that may qualify for refund review"
            subtitle="These are review scenarios, not guaranteed approvals."
          >
            <ul style={bulletListStyle()}>
              {reviewItems.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </WorkspaceSectionCard>

          <WorkspaceSectionCard
            title="Situations generally not refundable"
            subtitle="These usually fail refund review once value has already been consumed correctly."
          >
            <ul style={bulletListStyle()}>
              {generallyNotRefundable.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </WorkspaceSectionCard>
        </div>

        <WorkspaceSectionCard
          title="Failed or pending payment"
          subtitle="A failed payment should not change plan access unless successful confirmation is later received."
        >
          <div style={{ display: "grid", gap: 14 }}>
            <p style={bodyTextStyle()}>
              If Paystack does not confirm a successful payment, subscription access and top-up credits may remain unchanged. If your bank shows a debit but the app still shows no activation, wait for payment confirmation where applicable and then open Support with the reference and evidence.
            </p>
            <p style={bodyTextStyle()}>
              Do not repeat large payments several times without checking the Billing page and support route first, especially where a bank debit already appears.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Refund review window"
          subtitle="Requests should be made quickly while payment evidence is still easy to confirm."
        >
          <p style={bodyTextStyle()}>
            Eligible refund-related concerns should normally be raised within <strong>3 days of payment</strong>. Later requests may still be reviewed in unusual cases, but approval becomes harder when billing evidence, activation state, credit usage, or provider-side timing can no longer be confirmed clearly.
          </p>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Before you contact support"
          subtitle="These checks help reduce back-and-forth and speed up review."
        >
          <ul style={bulletListStyle()}>
            <li>Open Billing and confirm the latest visible payment reference matches the transaction you are reporting.</li>
            <li>Check whether the visible plan and credit balance already updated before opening a refund-related ticket.</li>
            <li>Keep receipts, debit alerts, Paystack references, and the selected plan name available.</li>
            <li>For duplicate-charge concerns, mention both references if more than one payment was captured.</li>
          </ul>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
