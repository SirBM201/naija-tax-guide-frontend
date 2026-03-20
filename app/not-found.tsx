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

function infoGridStyle(): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 16,
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

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <AppShell
      title="Page Not Found"
      subtitle="The page you tried to open does not exist, may have moved, or may not be available in this version of the portal."
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
          tone="warn"
          title="404 — Page not found"
          subtitle="We could not find the page you requested. Use one of the safe routes below to continue."
        />

        <WorkspaceSectionCard
          title="What this usually means"
          subtitle="This is typically a navigation or availability issue, not necessarily a problem with your account."
        >
          <div style={bodyStyle()}>
            <p style={{ margin: 0 }}>
              The page may have been removed, renamed, not yet created, or accessed
              through an outdated link. In some cases, the route may only be available
              after login, plan activation, or a future frontend release.
            </p>

            <div style={infoGridStyle()}>
              <div style={infoCardStyle()}>
                <p style={labelStyle()}>Most likely cause</p>
                <p style={valueStyle()}>Wrong or old link</p>
                <p style={helperStyle()}>
                  The route may no longer match the current frontend structure.
                </p>
              </div>

              <div style={infoCardStyle()}>
                <p style={labelStyle()}>Possible access case</p>
                <p style={valueStyle()}>Restricted or not ready</p>
                <p style={helperStyle()}>
                  Some pages may require login, billing access, or may still be under build.
                </p>
              </div>

              <div style={infoCardStyle()}>
                <p style={labelStyle()}>Recommended next step</p>
                <p style={valueStyle()}>Return safely</p>
                <p style={helperStyle()}>
                  Go back to Dashboard, Help, Billing, or Support instead of refreshing repeatedly.
                </p>
              </div>
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Safe next actions"
          subtitle="Use one of these routes to continue without getting stuck."
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
          subtitle="Support is the right route when the missing page blocks real account work."
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
              <li>You were redirected here after a normal in-app action.</li>
              <li>You expected a billing, credits, or support-related page and it failed to open.</li>
              <li>The same broken route appears repeatedly from valid navigation buttons.</li>
              <li>You believe your account or plan should have access to the missing page.</li>
            </ul>
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}