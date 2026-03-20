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

export default function UnavailablePage() {
  const router = useRouter();

  return (
    <AppShell
      title="Service Temporarily Unavailable"
      subtitle="The requested feature or page is currently unavailable. This may be caused by maintenance, provider interruption, or a temporary platform-side issue."
      actions={
        <>
          <button onClick={() => router.push("/dashboard")} style={shellButtonPrimary()}>
            Go to Dashboard
          </button>
          <button onClick={() => router.push("/support")} style={shellButtonSecondary()}>
            Open Support
          </button>
        </>
      }
    >
      <SectionStack>
        <Banner
          tone="danger"
          title="This service is temporarily unavailable"
          subtitle="The issue may be temporary. Use one of the safe routes below instead of repeatedly retrying the same failed action."
        />

        <WorkspaceSectionCard
          title="What this usually means"
          subtitle="This page is intended for temporary platform or provider availability issues."
        >
          <div style={bodyStyle()}>
            <div style={infoGridStyle()}>
              <div style={infoCardStyle()}>
                <p style={labelStyle()}>Possible cause</p>
                <p style={valueStyle()}>Temporary outage</p>
                <p style={helperStyle()}>
                  A backend dependency, payment provider, or linked service may be unavailable right now.
                </p>
              </div>

              <div style={infoCardStyle()}>
                <p style={labelStyle()}>Another possibility</p>
                <p style={valueStyle()}>Maintenance or update</p>
                <p style={helperStyle()}>
                  The affected feature may be under maintenance, rollout adjustment, or temporary change control.
                </p>
              </div>

              <div style={infoCardStyle()}>
                <p style={labelStyle()}>Recommended response</p>
                <p style={valueStyle()}>Use a safe route</p>
                <p style={helperStyle()}>
                  Return to Dashboard, Billing, Help, or Support while the unavailable route is avoided.
                </p>
              </div>
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Safe next actions"
          subtitle="Choose a stable route so you can continue using the portal."
        >
          <div style={actionRowStyle()}>
            <button onClick={() => router.push("/dashboard")} style={shellButtonPrimary()}>
              Dashboard
            </button>
            <button onClick={() => router.push("/help")} style={shellButtonSecondary()}>
              Help
            </button>
            <button onClick={() => router.push("/billing")} style={shellButtonSecondary()}>
              Billing
            </button>
            <button onClick={() => router.push("/support")} style={shellButtonSecondary()}>
              Support
            </button>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="When to contact support"
          subtitle="Support is appropriate if the unavailable state affects real account activity or keeps repeating."
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
              <li>You were trying to access billing, subscription, or credit-related functionality.</li>
              <li>A linked channel action failed and redirected to this unavailable state.</li>
              <li>The same temporary failure appears repeatedly over time and does not clear.</li>
              <li>You need confirmation whether the problem is account-specific or platform-wide.</li>
            </ul>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Good to know"
          subtitle="Temporary unavailability does not always mean data loss or account damage."
        >
          <div style={bodyStyle()}>
            <p style={{ margin: 0 }}>
              In many cases, a temporarily unavailable state is caused by a
              dependency issue, timeout, deployment event, or short-lived
              platform interruption rather than a permanent account problem.
            </p>
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}