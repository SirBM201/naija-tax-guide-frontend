"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell, {
  shellButtonPrimary,
  shellButtonSecondary,
} from "@/components/app-shell";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { Banner } from "@/components/ui";
import { SectionStack } from "@/components/page-layout";
import { useAuth } from "@/lib/auth";
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

function safeNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
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

function infoGridStyle(minWidth = 220): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minWidth}px), 1fr))`,
    gap: 16,
    width: "100%",
    alignItems: "stretch",
  };
}

function infoCardStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 18,
    background: "var(--surface)",
    padding: "clamp(14px, 2.8vw, 18px)",
    display: "grid",
    gap: 8,
    minWidth: 0,
    width: "100%",
    overflow: "hidden",
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
    lineHeight: 1.4,
  };
}

function valueStyle(): React.CSSProperties {
  return {
    fontSize: "clamp(18px, 4.8vw, 20px)",
    fontWeight: 900,
    color: "var(--text)",
    margin: 0,
    lineHeight: 1.3,
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    minWidth: 0,
  };
}

function helperStyle(): React.CSSProperties {
  return {
    fontSize: 14,
    color: "var(--text-muted)",
    lineHeight: 1.7,
    margin: 0,
    wordBreak: "break-word",
    overflowWrap: "anywhere",
  };
}

function bodyStyle(): React.CSSProperties {
  return {
    display: "grid",
    gap: 16,
    color: "var(--text)",
    fontSize: 15,
    lineHeight: 1.8,
    minWidth: 0,
  };
}

function actionGridStyle(): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
    gap: 12,
    width: "100%",
    alignItems: "stretch",
  };
}

function fullWidthButtonStyle(baseStyle: React.CSSProperties): React.CSSProperties {
  return {
    ...baseStyle,
    width: "100%",
    minWidth: 0,
    justifyContent: "center",
    textAlign: "center",
  };
}

function buttonStyleWithDisabledState(
  baseStyle: React.CSSProperties,
  disabled: boolean
): React.CSSProperties {
  const resolved = fullWidthButtonStyle(baseStyle);

  if (!disabled) {
    return {
      ...resolved,
      cursor: "pointer",
      opacity: 1,
    };
  }

  return {
    ...resolved,
    cursor: "not-allowed",
    opacity: 1,
    background: "#e5e7eb",
    color: "#6b7280",
    border: "1px solid #d1d5db",
    boxShadow: "none",
    filter: "grayscale(0.12)",
    transform: "none",
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, hasSession, authReady, logout } = useAuth();
  const { profile, subscription, billing, credits, channelLinks } = useWorkspaceState();

  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutNotice, setLogoutNotice] = useState("");

  const profileData = (profile ?? {}) as Record<string, unknown>;
  const subscriptionData = (subscription ?? {}) as Record<string, unknown>;
  const billingData = (billing ?? {}) as Record<string, unknown>;
  const creditsData = (credits ?? {}) as Record<string, unknown>;
  const channelLinksData = (channelLinks ?? {}) as Record<string, unknown>;
  const userData = (user ?? {}) as Record<string, unknown>;

  const accountEmail = safeText(
    profileData.email || userData.email || billingData.checkout_email || "Not currently available"
  );

  const accountName = safeText(
    profileData.full_name ||
      profileData.display_name ||
      profileData.first_name ||
      "Workspace user"
  );

  const accountId = safeText(
    profileData.account_id || profileData.id || userData.account_id || "Not currently available"
  );

  const rawPlanName = safeText(
    subscriptionData.plan_name ||
      billingData.plan_name ||
      subscriptionData.plan_code ||
      billingData.plan_code ||
      "",
    ""
  );

  const rawPlanStatus = safeText(subscriptionData.status || billingData.status || "", "");

  const normalizedPlanName = rawPlanName.toLowerCase();
  const normalizedPlanStatus = rawPlanStatus.toLowerCase();

  const isFreeContext =
    normalizedPlanName === "free" ||
    normalizedPlanName === "no active plan" ||
    normalizedPlanName === "" ||
    normalizedPlanStatus === "free" ||
    normalizedPlanStatus === "none" ||
    normalizedPlanStatus === "";

  const planName = isFreeContext ? "Free plan" : rawPlanName;
  const planStatus = isFreeContext ? "Available" : rawPlanStatus || "Active";

  const creditBalance = safeNumber(creditsData.balance, 0);

  const whatsappLinked = truthyValue(
    channelLinksData.whatsapp_linked ||
      (channelLinksData.whatsapp as Record<string, unknown> | undefined)?.linked
  );

  const telegramLinked = truthyValue(
    channelLinksData.telegram_linked ||
      (channelLinksData.telegram as Record<string, unknown> | undefined)?.linked
  );

  const channelState = useMemo(() => {
    if (whatsappLinked && telegramLinked) return "All linked";
    if (whatsappLinked || telegramLinked) return "Partially linked";
    return "No linked channel";
  }, [whatsappLinked, telegramLinked]);

  const channelHelper = useMemo(() => {
    return `WhatsApp: ${whatsappLinked ? "Linked" : "Not linked"} • Telegram: ${
      telegramLinked ? "Linked" : "Not linked"
    }`;
  }, [whatsappLinked, telegramLinked]);

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutNotice("");

    try {
      await logout();
      setLogoutNotice("You have been logged out successfully. Redirecting to login...");
      setTimeout(() => {
        router.replace("/login");
      }, 250);
    } catch {
      setLogoutNotice("Logout completed locally. Redirecting to login...");
      setTimeout(() => {
        router.replace("/login");
      }, 250);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <AppShell
      title="Profile"
      subtitle="Review your account identity, visible session state, linked channels, billing snapshot, and account actions."
      actions={
        <>
          <button
            onClick={() => router.push("/support")}
            style={fullWidthButtonStyle(shellButtonPrimary())}
          >
            Open Support
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            style={fullWidthButtonStyle(shellButtonSecondary())}
          >
            Back to Dashboard
          </button>
        </>
      }
    >
      <SectionStack>
        {!authReady ? (
          <Banner
            tone="default"
            title="Checking account state"
            subtitle="Please wait while the workspace verifies your current session."
          />
        ) : hasSession ? (
          <Banner
            tone="good"
            title="Account session is active"
            subtitle="You are currently signed in. Use this page to review your visible account details or sign out safely."
          />
        ) : (
          <Banner
            tone="warn"
            title="No active session detected"
            subtitle="You are not currently signed in, or the current session is no longer active. Go to Login to continue."
          />
        )}

        {logoutNotice ? <Banner tone="default" title="Account update" subtitle={logoutNotice} /> : null}

        <WorkspaceSectionCard
          title="Account identity"
          subtitle="These are the main visible account details currently available in the portal."
        >
          <div style={infoGridStyle(210)}>
            <div style={infoCardStyle()}>
              <p style={labelStyle()}>Account Name</p>
              <p style={valueStyle()}>{accountName}</p>
              <p style={helperStyle()}>
                Visible display identity for the current workspace account.
              </p>
            </div>

            <div style={infoCardStyle()}>
              <p style={labelStyle()}>Email Address</p>
              <p style={valueStyle()}>{accountEmail}</p>
              <p style={helperStyle()}>
                Visible email currently associated with the account or session.
              </p>
            </div>

            <div style={infoCardStyle()}>
              <p style={labelStyle()}>Account ID</p>
              <p style={valueStyle()}>{accountId}</p>
              <p style={helperStyle()}>
                Useful for support, billing review, and account verification.
              </p>
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Session and access"
          subtitle="This section helps the user understand whether access is currently active or limited."
        >
          <div style={infoGridStyle(210)}>
            <div style={infoCardStyle()}>
              <p style={labelStyle()}>Session Status</p>
              <p style={valueStyle()}>{hasSession ? "Signed in" : "Not signed in"}</p>
              <p style={helperStyle()}>Visible browser session state for this workspace.</p>
            </div>

            <div style={infoCardStyle()}>
              <p style={labelStyle()}>Access Method</p>
              <p style={valueStyle()}>Email OTP</p>
              <p style={helperStyle()}>
                Current frontend access flow is based on secure email one-time verification.
              </p>
            </div>

            <div style={infoCardStyle()}>
              <p style={labelStyle()}>Recommended next step</p>
              <p style={valueStyle()}>{hasSession ? "Continue normally" : "Login again"}</p>
              <p style={helperStyle()}>
                If access appears broken, re-login first before assuming a billing or platform issue.
              </p>
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Billing and channel snapshot"
          subtitle="A quick operational summary of the visible workspace state."
        >
          <div style={infoGridStyle(210)}>
            <div style={infoCardStyle()}>
              <p style={labelStyle()}>Current Plan</p>
              <p style={valueStyle()}>{planName}</p>
              <p style={helperStyle()}>
                Visible plan name from the current billing or subscription state.
              </p>
            </div>

            <div style={infoCardStyle()}>
              <p style={labelStyle()}>Plan Status</p>
              <p style={valueStyle()}>{planStatus}</p>
              <p style={helperStyle()}>
                Use Billing if the plan state does not match what you expect.
              </p>
            </div>

            <div style={infoCardStyle()}>
              <p style={labelStyle()}>Credits</p>
              <p style={valueStyle()}>{String(creditBalance)}</p>
              <p style={helperStyle()}>
                Visible AI credit balance currently available in the portal.
              </p>
            </div>

            <div style={infoCardStyle()}>
              <p style={labelStyle()}>Linked Channels</p>
              <p style={valueStyle()}>{channelState}</p>
              <p style={helperStyle()}>{channelHelper}</p>
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Account actions"
          subtitle="Use these routes to continue managing the account safely."
        >
          <div style={actionGridStyle()}>
            {!hasSession ? (
              <button
                onClick={() => router.push("/login")}
                style={fullWidthButtonStyle(shellButtonPrimary())}
              >
                Go to Login
              </button>
            ) : (
              <button
                onClick={() => router.push("/billing")}
                style={fullWidthButtonStyle(shellButtonPrimary())}
              >
                Open Billing
              </button>
            )}

            <button
              onClick={() => router.push("/channels")}
              style={fullWidthButtonStyle(shellButtonSecondary())}
            >
              Open Channels
            </button>

            <button
              onClick={() => router.push("/privacy")}
              style={fullWidthButtonStyle(shellButtonSecondary())}
            >
              Privacy
            </button>

            <button
              onClick={() => router.push("/data-deletion")}
              style={fullWidthButtonStyle(shellButtonSecondary())}
            >
              Data Deletion
            </button>

            <button
              onClick={handleLogout}
              disabled={loggingOut || !hasSession}
              aria-disabled={loggingOut || !hasSession}
              style={buttonStyleWithDisabledState(
                {
                  ...shellButtonSecondary(),
                  border: "1px solid rgba(220,38,38,0.28)",
                },
                loggingOut || !hasSession
              )}
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="When to use support"
          subtitle="Support is the right route when identity, billing, credits, or linked access do not look correct."
        >
          <div style={bodyStyle()}>
            <ul
              style={{
                margin: 0,
                paddingLeft: 20,
                display: "grid",
                gap: 12,
                lineHeight: 1.8,
                wordBreak: "break-word",
                overflowWrap: "anywhere",
              }}
            >
              <li>Your email, account state, or billing snapshot looks incorrect.</li>
              <li>Your plan or credits do not match a recent payment or renewal.</li>
              <li>You cannot restore access even after signing in again.</li>
              <li>Your linked channel state appears broken or inconsistent.</li>
            </ul>
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
