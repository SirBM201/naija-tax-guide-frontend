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
    gap: 18,
    color: "var(--text)",
    fontSize: 16,
    lineHeight: 1.9,
  };
}

function actionRowStyle(): React.CSSProperties {
  return {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
  };
}

function infoGridStyle(): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 16,
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
  };
}

function labelStyle(): React.CSSProperties {
  return {
    fontSize: 13,
    fontWeight: 800,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    margin: 0,
  };
}

function valueStyle(): React.CSSProperties {
  return {
    fontSize: 20,
    fontWeight: 900,
    color: "var(--text)",
    margin: 0,
  };
}

function helperStyle(): React.CSSProperties {
  return {
    fontSize: 15,
    color: "var(--text-muted)",
    lineHeight: 1.7,
    margin: 0,
  };
}

export default function PaymentSuccessPage() {
  const router = useRouter();

  return (
    <AppShell
      title="Payment Successful"
      subtitle="Your payment was completed successfully. The selected billing action should now be reflected in your account, subject to normal processing and sync timing."
      actions={
        <>
          <button onClick={() => router.push("/billing")} style={shellButtonPrimary()}>
            Open Billing
          </button>
          <button onClick={() => router.push("/dashboard")} style={shellButtonSecondary()}>
            Back to Dashboard
          </button>
        </>
      }
    >
      <SectionStack>
        <Banner
          tone="good"
          title="Payment completed successfully"
          subtitle="Your transaction was received. You can now verify your plan, billing state, credits, or renewal details in the Billing section."
        />

        <WorkspaceSectionCard
          title="What usually happens next"
          subtitle="Successful payments may still require a short processing window before every visible account state updates."
        >
          <div style={bodyStyle()}>
            <div style={infoGridStyle()}>
              <div style={infoCardStyle()}>
                <p style={labelStyle()}>Expected outcome</p>
                <p style={valueStyle()}>Billing state updates</p>
                <p style={helperStyle()}>
                  Your subscription, renewal status, or payment record should become visible in the relevant billing view.
                </p>
              </div>

              <div style={infoCardStyle()}>
                <p style={labelStyle()}>Possible short delay</p>
                <p style={valueStyle()}>Sync or webhook timing</p>
                <p style={helperStyle()}>
                  Some platforms update immediately, while others may need a short processing interval before everything appears.
                </p>
              </div>

              <div style={infoCardStyle()}>
                <p style={labelStyle()}>Recommended check</p>
                <p style={valueStyle()}>Review Billing</p>
                <p style={helperStyle()}>
                  Open Billing or Plans to confirm whether the expected upgrade or payment effect is already visible.
                </p>
              </div>
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Recommended next actions"
          subtitle="Use one of these routes to confirm the effect of your successful payment."
        >
          <div style={actionRowStyle()}>
            <button onClick={() => router.push("/billing")} style={shellButtonPrimary()}>
              Billing
            </button>
            <button onClick={() => router.push("/plans")} style={shellButtonSecondary()}>
              Plans
            </button>
            <button onClick={() => router.push("/credits")} style={shellButtonSecondary()}>
              Credits
            </button>
            <button onClick={() => router.push("/dashboard")} style={shellButtonSecondary()}>
              Dashboard
            </button>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="If the account does not update immediately"
          subtitle="A successful payment page does not always mean every visible account field updates at the exact same second."
        >
          <div style={bodyStyle()}>
            <p style={{ margin: 0 }}>
              If your plan, credits, renewal state, or payment record does not
              appear immediately, allow a short processing window and then check
              Billing again. Temporary delay can happen due to payment provider
              confirmation timing, webhook delivery, or platform-side state sync.
            </p>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="When to contact support"
          subtitle="Support is appropriate when payment succeeded but the practical account result still does not match expectations."
        >
          <div style={bodyStyle()}>
            <ul
              style={{
                margin: 0,
                paddingLeft: 22,
                display: "grid",
                gap: 12,
                lineHeight: 1.8,
              }}
            >
              <li>You completed payment but your plan did not change after a reasonable waiting period.</li>
              <li>Your credits, renewal state, or subscription visibility remains incorrect.</li>
              <li>You suspect duplicate charging, incomplete activation, or inconsistent billing state.</li>
              <li>You need the payment to be reviewed against a visible transaction reference.</li>
            </ul>
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}