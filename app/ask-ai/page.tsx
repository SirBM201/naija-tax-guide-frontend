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
import { useWorkspaceState } from "@/hooks/useWorkspaceState";

function safeText(value: unknown, fallback = "—"): string {
  const text =
    typeof value === "string"
      ? value.trim()
      : value == null
      ? ""
      : String(value).trim();
  return text || fallback;
}

function truthyValue(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const raw = value.trim().toLowerCase();
    return ["1", "true", "yes", "active", "paid", "enabled", "linked"].includes(raw);
  }
  return false;
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
    wordBreak: "break-word",
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

export default function BillingPage() {
  const router = useRouter();

  const {
    subscription,
    billing,
    credits,
    usage,
  } = useWorkspaceState();

  const planName = safeText(
    subscription?.plan_name ||
      billing?.plan_name ||
      subscription?.plan_code ||
      billing?.plan_code ||
      "No active plan"
  );

  const planCode = safeText(
    subscription?.plan_code ||
      billing?.plan_code ||
      "Not currently available"
  );

  const planStatus = safeText(
    subscription?.status ||
      billing?.status ||
      "Unknown"
  );

  const activeNow = truthyValue(
    subscription?.active ||
      billing?.active ||
      planStatus.toLowerCase() === "active"
  );

  const renewalStatus = safeText(
    billing?.renewal_status ||
      subscription?.renewal_status ||
      "Not currently available"
  );

  const paymentReference = safeText(
    billing?.payment_reference ||
      billing?.reference ||
      "Not currently available"
  );

  const checkoutEmail = safeText(
    billing?.checkout_email ||
      "Not currently available"
  );

  const creditBalance = Number(credits?.balance ?? 0);
  const creditUpdatedAt = safeText(
    credits?.updated_at ||
      "Not currently available"
  );

  const usageToday = safeText(
    usage?.count ?? usage?.daily_usage ?? "Not currently available"
  );

  return (
    <AppShell
      title="Billing"
      subtitle="Review your plan, payment state, renewal status, credits, and related billing visibility in one clear workspace view."
      actions={
        <>
          <button onClick={() => router.push("/plans")} style={shellButtonPrimary()}>
            Open Plans
          </button>
          <button onClick={() => router.push("/dashboard")} style={shellButtonSecondary()}>
            Back to Dashboard
          </button>
        </>
      }
    >
      <SectionStack>
        <Banner
          tone={activeNow ? "good" : "warn"}
          title={activeNow ? "Billing appears active" : "No clearly active billing state is visible"}
          subtitle={
            activeNow
              ? "Your visible subscription state currently looks active. Review the details below to confirm renewal, credits, and payment visibility."
              : "Your workspace does not currently show a clearly active billing state. Review Plans or Support if this does not match your expectation."
          }
        />

        <WorkspaceSectionCard
          title="Billing summary"
          subtitle="This section shows the main visible billing state currently available in the portal."
        >
          <div style={infoGridStyle()}>
            <div style={infoCardStyle()}>
              <p style={labelStyle()}>Current Plan</p>
              <p style={valueStyle()}>{planName}</p>
              <p style={helperStyle()}>
                Visible plan name currently associated with this workspace.
              </p>
            </div>

            <div style={infoCardStyle()}>
              <p style={labelStyle()}>Plan Code</p>
              <p style={valueStyle()}>{planCode}</p>
              <p style={helperStyle()}>
                Useful for matching plan logic and backend billing references.
              </p>
            </div>

            <div style={infoCardStyle()}>
              <p style={labelStyle()}>Plan Status</p>
              <p style={valueStyle()}>{planStatus}</p>
              <p style={helperStyle()}>
                If this does not match what you expect, review recent payment activity or contact support.
              </p>
            </div>

            <div style={infoCardStyle()}>
              <p style={labelStyle()}>Renewal Status</p>
              <p style={valueStyle()}>{renewalStatus}</p>
              <p style={helperStyle()}>
                Indicates whether the visible subscription looks renewable, pending, or otherwise limited.
              </p>
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Payment visibility"
          subtitle="Review the visible payment and checkout-related details currently available."
        >
          <div style={infoGridStyle()}>
            <div style={infoCardStyle()}>
              <p style={labelStyle()}>Checkout Email</p>
              <p style={valueStyle()}>{checkoutEmail}</p>
              <p style={helperStyle()}>
                Visible billing-side email address associated with the most relevant checkout state.
              </p>
            </div>

            <div style={infoCardStyle()}>
              <p style={labelStyle()}>Payment Reference</p>
              <p style={valueStyle()}>{paymentReference}</p>
              <p style={helperStyle()}>
                Useful when support needs to verify a payment, callback, or transaction history issue.
              </p>
            </div>

            <div style={infoCardStyle()}>
              <p style={labelStyle()}>Billing Activity</p>
              <p style={valueStyle()}>{activeNow ? "Operational" : "Needs review"}</p>
              <p style={helperStyle()}>
                This is a quick workspace-level interpretation of the currently visible billing state.
              </p>
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Credits and usage"
          subtitle="Credits and usage often help explain why access feels limited even when billing looks successful."
        >
          <div style={infoGridStyle()}>
            <div style={infoCardStyle()}>
              <p style={labelStyle()}>Credits</p>
              <p style={valueStyle()}>{String(creditBalance)}</p>
              <p style={helperStyle()}>
                Current visible AI credit balance in the workspace.
              </p>
            </div>

            <div style={infoCardStyle()}>
              <p style={labelStyle()}>Credits Updated</p>
              <p style={valueStyle()}>{creditUpdatedAt}</p>
              <p style={helperStyle()}>
                Useful when checking whether a payment or credit refresh has already been applied.
              </p>
            </div>

            <div style={infoCardStyle()}>
              <p style={labelStyle()}>Usage Today</p>
              <p style={valueStyle()}>{usageToday}</p>
              <p style={helperStyle()}>
                Daily visible usage can help explain why access behavior may feel restricted.
              </p>
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Recommended next actions"
          subtitle="Use these routes to continue billing review safely."
        >
          <div style={actionRowStyle()}>
            <button onClick={() => router.push("/plans")} style={shellButtonPrimary()}>
              Open Plans
            </button>

            <button onClick={() => router.push("/credits")} style={shellButtonSecondary()}>
              Open Credits
            </button>

            <button onClick={() => router.push("/support")} style={shellButtonSecondary()}>
              Open Support
            </button>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Before raising a billing complaint"
          subtitle="These are the most useful checks before opening a support request."
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
              <li>Confirm the selected plan is the one you intended to activate.</li>
              <li>Check whether payment is successful, failed, or still pending before retrying.</li>
              <li>Allow a short sync window for plan or credit updates after payment.</li>
              <li>Use Support if the visible billing result remains inconsistent after a reasonable wait.</li>
            </ul>
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}