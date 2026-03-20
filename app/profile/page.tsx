"use client";

import React, { useEffect, useMemo, useState } from "react";
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

export default function ProfilePage() {
  const router = useRouter();
  const { user, hasSession, authReady, logout } = useAuth();

  const {
    profile,
    subscription,
    billing,
    credits,
    channelLinks,
  } = useWorkspaceState();

  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutNotice, setLogoutNotice] = useState("");

  const accountEmail = safeText(
    profile?.email || user?.email || billing?.checkout_email || "Not currently available"
  );

  const accountName = safeText(
    profile?.full_name ||
      profile?.display_name ||
      profile?.first_name ||
      "Workspace user"
  );

  const accountId = safeText(
    profile?.account_id || profile?.id || user?.account_id || "Not currently available"
  );

  const planName = safeText(
    subscription?.plan_name ||
      billing?.plan_name ||
      subscription?.plan_code ||
      billing?.plan_code ||
      "No active plan"
  );

  const planStatus = safeText(subscription?.status || billing?.status || "Unknown");
  const creditBalance = Number(credits?.balance ?? 0);

  const whatsappLinked = truthyValue(
    channelLinks?.whatsapp_linked || channelLinks?.whatsapp?.linked
  );
  const telegramLinked = truthyValue(
    channelLinks?.telegram_linked || channelLinks?.telegram?.linked
  );

  const channelState = useMemo(() => {
    if (whatsappLinked && telegramLinked) return "WhatsApp + Telegram linked";
    if (whatsappLinked) return "WhatsApp linked";
    if (telegramLinked) return "Telegram linked";
    return "No linked channel";
  }, [whatsappLinked, telegramLinked]);

  useEffect(() => {
    if (!authReady) return;
    if (!hasSession) {
      setLogoutNotice("");
    }
  }, [authReady, hasSession]);

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutNotice("");

    try {
      await logout();
      setLogoutNotice("You have been logged out successfully.");
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
          <button onClick={() => router.push("/support")} style={shellButtonPrimary()}>
            Open Support
          </button>
          <button onClick={() => router.push("/dashboard")} style={shellButtonSecondary()}>
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

        {logoutNotice ? (
          <Banner
            tone="default"
            title="Account update"
            subtitle={logoutNotice}
          />
        ) : null}

        <WorkspaceSectionCard
          title="Account identity"
          subtitle="These are the main visible account details currently available in the portal."
        >
          <div style={infoGridStyle()}>
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
          <div style={infoGridStyle()}>
            <div style={infoCardStyle()}>
              <p style={labelStyle()}>Session Status</p>
              <p style={valueStyle()}>{hasSession ? "Signed in" : "Not signed in"}</p>
              <p style={helperStyle()}>
                Visible browser session state for this workspace.
              </p>
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
          <div style={infoGridStyle()}>
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
              <p style={helperStyle()}>
                Visible WhatsApp and Telegram linking state for this account.
              </p>
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Account actions"
          subtitle="Use these routes to continue managing the account safely."
        >
          <div style={actionRowStyle()}>
            {!hasSession ? (
              <button
                onClick={() => router.push("/login")}
                style={shellButtonPrimary()}
              >
                Go to Login
              </button>
            ) : (
              <button
                onClick={() => router.push("/billing")}
                style={shellButtonPrimary()}
              >
                Open Billing
              </button>
            )}

            <button
              onClick={() => router.push("/privacy")}
              style={shellButtonSecondary()}
            >
              Privacy
            </button>

            <button
              onClick={() => router.push("/data-deletion")}
              style={shellButtonSecondary()}
            >
              Data Deletion
            </button>

            <button
              onClick={handleLogout}
              disabled={loggingOut || !hasSession}
              style={{
                ...shellButtonSecondary(),
                opacity: loggingOut || !hasSession ? 0.7 : 1,
                cursor: loggingOut || !hasSession ? "not-allowed" : "pointer",
                border: "1px solid rgba(220,38,38,0.28)",
              }}
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
                paddingLeft: 22,
                display: "grid",
                gap: 12,
                lineHeight: 1.8,
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