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

export default function RefundPage() {
  const router = useRouter();

  const supportLinks = {
    duplicate: "/support?intent=duplicate_charge",
    wrongPlan: "/support?intent=wrong_plan",
    activation: "/support?intent=activation_issue",
    refund: "/support?intent=refund_review",
  };

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
          title="Before you request a refund review"
          subtitle="Use Billing for your account-specific plan, payment reference, credit balance, and expiry details."
        >
          <p style={bodyTextStyle()}>
            Public visitors may read this policy without logging in. Logged-in users
            should open Billing first to confirm the exact payment reference,
            selected plan, activation state, and visible credits before submitting
            a refund-related support request.
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
                Use this when the same card, bank account, or payment method appears to have been billed more than once for the same intended payment.
              </p>
              <div style={{ marginTop: 2 }}>
                <button
                  onClick={() => router.push(supportLinks.duplicate)}
                  style={actionButtonStyle(true)}
                >
                  Report Duplicate Charge
                </button>
              </div>
            </div>

            <div style={cardTextBlockStyle()}>
              <p style={valueStyle()}>Wrong plan activated</p>
              <p style={bodyTextStyle()}>
                Use this when payment was successful but the visible plan does not match the one you intended to buy.
              </p>
              <div style={{ marginTop: 2 }}>
                <button
                  onClick={() => router.push(supportLinks.wrongPlan)}
                  style={actionButtonStyle(false)}
                >
                  Report Wrong Plan
                </button>
              </div>
            </div>

            <div style={cardTextBlockStyle()}>
              <p style={valueStyle()}>Payment successful but access failed</p>
              <p style={bodyTextStyle()}>
                Use this when the payment completed but activation, credits, or access did not reflect correctly.
              </p>
              <div style={{ marginTop: 2 }}>
                <button
                  onClick={() => router.push(supportLinks.activation)}
                  style={actionButtonStyle(false)}
                >
                  Report Activation Issue
                </button>
              </div>
            </div>

            <div style={cardTextBlockStyle()}>
              <p style={valueStyle()}>Refund review request</p>
              <p style={bodyTextStyle()}>
                Use this when you believe the transaction falls inside the refund-review rules on this page.
              </p>
              <div style={{ marginTop: 2 }}>
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
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
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
            <li>Open Billing and confirm the latest visible payment reference matches the transaction you are reporting.</li>
            <li>Check whether the visible plan and credit balance already updated before opening a new refund-related ticket.</li>
            <li>Use the issue-specific support buttons above so billing context is easier to understand.</li>
            <li>For duplicate-charge concerns, mention both references if more than one payment was captured.</li>
          </ul>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
