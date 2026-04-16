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
    fontSize: 15,
    lineHeight: 1.85,
    minWidth: 0,
  };
}

function actionGridStyle(): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
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
    letterSpacing: 0.4,
    margin: 0,
    wordBreak: "break-word",
  };
}

function valueStyle(): React.CSSProperties {
  return {
    fontSize: "clamp(18px, 4.5vw, 20px)",
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
    gap: 10,
    lineHeight: 1.75,
    minWidth: 0,
  };
}

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <AppShell
      title="Access Restricted"
      subtitle="This page requires the right session, account access level, or active eligibility before it can be opened."
      actions={
        <div style={actionGridStyle()}>
          <button onClick={() => router.push("/login")} style={{ ...shellButtonPrimary(), width: "100%" }}>
            Go to Login
          </button>
          <button onClick={() => router.push("/dashboard")} style={{ ...shellButtonSecondary(), width: "100%" }}>
            Back to Dashboard
          </button>
        </div>
      }
    >
      <SectionStack>
        <Banner
          tone="warn"
          title="Unauthorized or restricted access"
          subtitle="You do not currently have permission to open this page, or your session may no longer be valid."
        />

        <WorkspaceSectionCard
          title="What this usually means"
          subtitle="This is often caused by session expiry, missing login state, plan restriction, or access rules for the requested route."
        >
          <div style={bodyStyle()}>
            <div style={infoGridStyle()}>
              <div style={infoCardStyle()}>
                <p style={labelStyle()}>Common cause</p>
                <p style={valueStyle()}>Session expired</p>
                <p style={helperStyle()}>
                  Your account session may have timed out or no longer matches the page requirement.
                </p>
              </div>

              <div style={infoCardStyle()}>
                <p style={labelStyle()}>Possible access case</p>
                <p style={valueStyle()}>Login required</p>
                <p style={helperStyle()}>
                  Some routes are only available after authentication or workspace resolution.
                </p>
              </div>

              <div style={infoCardStyle()}>
                <p style={labelStyle()}>Another possible cause</p>
                <p style={valueStyle()}>Plan or feature restriction</p>
                <p style={helperStyle()}>
                  The requested page may depend on plan status, billing state, or feature eligibility.
                </p>
              </div>
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Recommended next actions"
          subtitle="Use one of these safe routes to restore access or continue productively."
        >
          <div style={actionGridStyle()}>
            <button onClick={() => router.push("/login")} style={{ ...shellButtonPrimary(), width: "100%" }}>
              Login Again
            </button>
            <button onClick={() => router.push("/dashboard")} style={{ ...shellButtonSecondary(), width: "100%" }}>
              Dashboard
            </button>
            <button onClick={() => router.push("/billing")} style={{ ...shellButtonSecondary(), width: "100%" }}>
              Billing
            </button>
            <button onClick={() => router.push("/support")} style={{ ...shellButtonSecondary(), width: "100%" }}>
              Support
            </button>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="When to use support"
          subtitle="Support is the right next step when access should already be available but still fails."
        >
          <div style={bodyStyle()}>
            <ul style={listStyle()}>
              <li>You are already logged in but the same page still refuses to open.</li>
              <li>You recently paid, upgraded, or renewed and access has not updated correctly.</li>
              <li>You believe your credits, billing state, or linked workspace should allow access.</li>
              <li>You were redirected here from a valid in-app action and not from a manual URL entry.</li>
            </ul>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Good to know"
          subtitle="Restricted access is not always an error."
        >
          <div style={bodyStyle()}>
            <p style={{ margin: 0, wordBreak: "break-word" }}>
              Some pages are intentionally limited to authenticated users,
              resolved accounts, or active billing states. This helps protect
              account data, enforce plan boundaries, and keep the platform
              behavior predictable.
            </p>
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
