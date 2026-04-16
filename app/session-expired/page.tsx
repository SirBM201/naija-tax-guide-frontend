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

function topActionGridStyle(): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
    width: "100%",
    alignItems: "stretch",
  };
}

function actionGridStyle(): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 12,
    width: "100%",
    alignItems: "stretch",
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
    overflowWrap: "anywhere",
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
    fontSize: "clamp(18px, 4vw, 20px)",
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
    lineHeight: 1.75,
    margin: 0,
    wordBreak: "break-word",
    overflowWrap: "anywhere",
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
    overflowWrap: "anywhere",
  };
}

export default function SessionExpiredPage() {
  const router = useRouter();

  return (
    <AppShell
      title="Session Expired"
      subtitle="Your current login session is no longer active. Please sign in again to continue using protected account features."
      actions={
        <div style={topActionGridStyle()}>
          <button onClick={() => router.push("/login")} style={{ ...shellButtonPrimary(), width: "100%" }}>
            Sign In Again
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
          title="Your session has expired"
          subtitle="For account security, protected actions may stop working when a session times out or becomes invalid."
        />

        <WorkspaceSectionCard
          title="What this usually means"
          subtitle="This state typically appears when the app can no longer confirm your current login session."
        >
          <div style={bodyStyle()}>
            <div style={infoGridStyle()}>
              <div style={infoCardStyle()}>
                <p style={labelStyle()}>Common cause</p>
                <p style={valueStyle()}>Timed-out login</p>
                <p style={helperStyle()}>
                  Your session may have expired after inactivity or after the token or cookie reached its time limit.
                </p>
              </div>

              <div style={infoCardStyle()}>
                <p style={labelStyle()}>Another cause</p>
                <p style={valueStyle()}>Invalid auth state</p>
                <p style={helperStyle()}>
                  The browser may no longer have the valid authentication state needed for protected pages.
                </p>
              </div>

              <div style={infoCardStyle()}>
                <p style={labelStyle()}>Recommended action</p>
                <p style={valueStyle()}>Sign in again</p>
                <p style={helperStyle()}>
                  Re-authenticate before retrying billing, credits, support, or other account-linked actions.
                </p>
              </div>
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Recommended next actions"
          subtitle="Use one of these safe routes to restore access or continue browsing."
        >
          <div style={actionGridStyle()}>
            <button onClick={() => router.push("/login")} style={{ ...shellButtonPrimary(), width: "100%" }}>
              Login
            </button>
            <button onClick={() => router.push("/dashboard")} style={{ ...shellButtonSecondary(), width: "100%" }}>
              Dashboard
            </button>
            <button onClick={() => router.push("/help")} style={{ ...shellButtonSecondary(), width: "100%" }}>
              Help
            </button>
            <button onClick={() => router.push("/support")} style={{ ...shellButtonSecondary(), width: "100%" }}>
              Support
            </button>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="What may be affected"
          subtitle="When a session expires, some features may appear broken even though the real issue is authentication."
        >
          <div style={bodyStyle()}>
            <ul style={listStyle()}>
              <li>Billing pages may stop updating correctly.</li>
              <li>Credits, plans, and protected workspace actions may fail to load.</li>
              <li>Support submission or support inbox replies may be rejected.</li>
              <li>Channel-linked actions may fail until login is restored.</li>
            </ul>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="When to contact support"
          subtitle="Support is appropriate when re-login should work but access still does not recover."
        >
          <div style={bodyStyle()}>
            <ul style={listStyle()}>
              <li>You signed in again and the same expired-session behavior continues.</li>
              <li>You are redirected repeatedly even after successful login.</li>
              <li>Your account appears locked out from billing or protected workspace areas.</li>
              <li>You suspect a session bug, cookie issue, or account-auth mismatch.</li>
            </ul>
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
