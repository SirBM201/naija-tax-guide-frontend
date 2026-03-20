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

export default function SessionExpiredPage() {
  const router = useRouter();

  return (
    <AppShell
      title="Session Expired"
      subtitle="Your current login session is no longer active. Please sign in again to continue using protected account features."
      actions={
        <>
          <button onClick={() => router.push("/login")} style={shellButtonPrimary()}>
            Sign In Again
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
                  Your session may have expired after inactivity or after the token/cookie reached its limit.
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
          <div style={actionRowStyle()}>
            <button onClick={() => router.push("/login")} style={shellButtonPrimary()}>
              Login
            </button>
            <button onClick={() => router.push("/dashboard")} style={shellButtonSecondary()}>
              Dashboard
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
          title="What may be affected"
          subtitle="When a session expires, some features may appear broken even though the real issue is authentication."
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
            <ul
              style={{
                margin: 0,
                paddingLeft: 22,
                display: "grid",
                gap: 12,
                lineHeight: 1.8,
              }}
            >
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