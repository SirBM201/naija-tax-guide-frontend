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
    minWidth: 0,
  };
}

function infoGridStyle(): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
    minWidth: 0,
  };
}

function infoCardStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 18,
    background: "var(--surface)",
    padding: 16,
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
    letterSpacing: 0.4,
    margin: 0,
    wordBreak: "break-word",
  };
}

function valueStyle(): React.CSSProperties {
  return {
    fontSize: "clamp(20px, 4vw, 22px)",
    fontWeight: 900,
    color: "var(--text)",
    margin: 0,
    lineHeight: 1.2,
    wordBreak: "break-word",
  };
}

function helperStyle(): React.CSSProperties {
  return {
    fontSize: 14,
    color: "var(--text-muted)",
    lineHeight: 1.7,
    margin: 0,
    wordBreak: "break-word",
  };
}

function listStyle(): React.CSSProperties {
  return {
    margin: 0,
    paddingLeft: 20,
    display: "grid",
    gap: 12,
    lineHeight: 1.8,
    fontSize: 15,
    minWidth: 0,
    wordBreak: "break-word",
  };
}

export default function PaymentPendingPage() {
  const router = useRouter();

  return (
    <AppShell
      title="Payment Pending"
      subtitle="Your payment attempt has not yet reached a final confirmed state. This may be caused by processing delay, provider confirmation timing, or an incomplete billing callback."
      actions={
        <>
          <button onClick={() => router.push("/billing")} style={shellButtonPrimary()}>
            Check Billing
          </button>
          <button onClick={() => router.push("/dashboard")} style={shellButtonSecondary()}>
            Back to Dashboard
          </button>
        </>
      }
    >
      <SectionStack>
        <Banner
          tone="warn"
          title="Payment is still pending"
          subtitle="The billing result is not yet final. Please avoid repeated payment attempts until the current transaction has been reviewed."
        />

        <WorkspaceSectionCard
          title="What this usually means"
          subtitle="A pending result often means the transaction is still waiting for final provider confirmation."
        >
          <div style={bodyStyle()}>
            <div style={infoGridStyle()}>
              <div style={infoCardStyle()}>
                <p style={labelStyle()}>Possible cause</p>
                <p style={valueStyle()}>Provider confirmation delay</p>
                <p style={helperStyle()}>
                  The payment processor may still be confirming the transaction outcome.
                </p>
              </div>

              <div style={infoCardStyle()}>
                <p style={labelStyle()}>Another possibility</p>
                <p style={valueStyle()}>Webhook or sync lag</p>
                <p style={helperStyle()}>
                  The platform may not yet have received or processed the final payment callback.
                </p>
              </div>

              <div style={infoCardStyle()}>
                <p style={labelStyle()}>Recommended action</p>
                <p style={valueStyle()}>Wait, then verify</p>
                <p style={helperStyle()}>
                  Give the transaction a short window, then recheck Billing before trying another payment.
                </p>
              </div>
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Recommended next actions"
          subtitle="Use these routes to verify the current state without creating extra billing confusion."
        >
          <div style={actionGridStyle()}>
            <button onClick={() => router.push("/billing")} style={{ ...shellButtonPrimary(), width: "100%" }}>
              Billing
            </button>
            <button onClick={() => router.push("/plans")} style={{ ...shellButtonSecondary(), width: "100%" }}>
              Plans
            </button>
            <button onClick={() => router.push("/dashboard")} style={{ ...shellButtonSecondary(), width: "100%" }}>
              Dashboard
            </button>
            <button onClick={() => router.push("/support")} style={{ ...shellButtonSecondary(), width: "100%" }}>
              Support
            </button>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="What not to do immediately"
          subtitle="Repeated payment retries during a pending state can create unnecessary confusion."
        >
          <div style={bodyStyle()}>
            <ul style={listStyle()}>
              <li>Do not repeatedly refresh checkout and submit the same payment again without review.</li>
              <li>Do not assume failure just because the final success state has not appeared yet.</li>
              <li>Do not create multiple rapid payment attempts if one transaction may still be processing.</li>
              <li>Do not ignore the Billing page if it later shows that the transaction was completed successfully.</li>
            </ul>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="When to contact support"
          subtitle="Support is appropriate if the pending state lasts too long or the billing result becomes unclear."
        >
          <div style={bodyStyle()}>
            <ul style={listStyle()}>
              <li>The transaction stays pending longer than expected without any update.</li>
              <li>You are unsure whether the payment succeeded, failed, or is duplicated.</li>
              <li>You believe money was deducted but the account state remains unresolved.</li>
              <li>You need help confirming the final transaction result against billing records.</li>
            </ul>
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
