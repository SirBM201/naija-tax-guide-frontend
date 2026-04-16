"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell, {
  shellButtonPrimary,
  shellButtonSecondary,
} from "@/components/app-shell";
import {
  Banner,
  Card,
  ShortcutCard,
  formatDate,
  planDisplayName,
} from "@/components/ui";
import {
  CardsGrid,
  SectionStack,
  TwoColumnSection,
} from "@/components/page-layout";
import { getWelcomeSeen, setWelcomeSeen } from "@/lib/preferences-storage";
import { useWorkspaceState } from "@/hooks/useWorkspaceState";
import { useAuth } from "@/lib/auth";

function SafeMetricCard({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: "default" | "good" | "warn" | "danger";
}) {
  const border =
    tone === "good"
      ? "var(--success-border)"
      : tone === "warn"
        ? "var(--warn-border)"
        : tone === "danger"
          ? "var(--danger-border)"
          : "var(--border)";

  const background =
    tone === "good"
      ? "var(--success-bg)"
      : tone === "warn"
        ? "var(--warn-bg)"
        : tone === "danger"
          ? "var(--danger-bg)"
          : "var(--surface)";

  return (
    <div
      style={{
        borderRadius: 18,
        border: `1px solid ${border}`,
        background,
        padding: 16,
        minWidth: 0,
      }}
    >
      <div style={{ color: "var(--text-faint)", fontSize: 13 }}>{label}</div>
      <div
        style={{
          marginTop: 8,
          color: "var(--text)",
          fontWeight: 900,
          fontSize: "clamp(20px, 4vw, 24px)",
          lineHeight: 1.2,
          wordBreak: "break-word",
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </div>
      {helper ? (
        <div
          style={{
            marginTop: 8,
            color: "var(--text-muted)",
            fontSize: 13,
            lineHeight: 1.65,
            wordBreak: "break-word",
            overflowWrap: "anywhere",
          }}
        >
          {helper}
        </div>
      ) : null}
    </div>
  );
}

function WelcomeStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 18,
        display: "grid",
        gap: 10,
        background: "var(--surface)",
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          background: "var(--accent-soft)",
          color: "var(--text)",
          fontSize: 14,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {number}
      </div>

      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "var(--text)",
          lineHeight: 1.5,
          wordBreak: "break-word",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 14,
          color: "var(--text-muted)",
          lineHeight: 1.7,
          wordBreak: "break-word",
        }}
      >
        {description}
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "var(--text)",
          lineHeight: 1.4,
          wordBreak: "break-word",
        }}
      >
        {title}
      </div>

      {subtitle ? (
        <div
          style={{
            fontSize: 14,
            color: "var(--text-muted)",
            lineHeight: 1.7,
            wordBreak: "break-word",
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

function ActionGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 10,
        width: "100%",
      }}
    >
      {children}
    </div>
  );
}

function shouldForceOpen(sp: URLSearchParams | null) {
  if (!sp) return false;

  return (
    sp.get("force") === "1" ||
    sp.get("open") === "1" ||
    sp.get("revisit") === "1"
  );
}

function WelcomePageContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const { hasSession } = useAuth();

  const [pageReady, setPageReady] = useState(false);

  const forceOpen = useMemo(() => shouldForceOpen(sp), [sp]);

  const {
    busy,
    status,
    load,
    accountId,
    email,
    activeNow,
    planCode,
    creditBalance,
    expiresAt,
  } = useWorkspaceState({
    autoLoad: false,
    includeAccount: true,
    includeBilling: true,
    includeDebug: false,
    loadingMessage: "Loading welcome page...",
  });

  useEffect(() => {
    if (!hasSession) return;

    if (getWelcomeSeen() && !forceOpen) {
      router.replace("/dashboard");
      return;
    }

    setPageReady(true);
  }, [hasSession, forceOpen, router]);

  useEffect(() => {
    if (!pageReady) return;
    void load("Loading welcome page...");
  }, [pageReady, load]);

  const handleContinue = () => {
    setWelcomeSeen(true);
    router.replace("/dashboard");
  };

  const handleAskPage = () => {
    setWelcomeSeen(true);
    router.replace("/ask");
  };

  const handleRefresh = () => {
    void load("Loading welcome page...");
  };

  const loweredStatus = status.toLowerCase();
  const statusTone =
    loweredStatus.includes("ready")
      ? "good"
      : loweredStatus.includes("partial") ||
          loweredStatus.includes("inactive") ||
          loweredStatus.includes("attention")
        ? "warn"
        : "default";

  if (!pageReady) {
    return (
      <AppShell
        title="Welcome"
        subtitle="Preparing your onboarding workspace..."
      >
        <SectionStack>
          <Banner
            title="Preparing welcome page"
            subtitle="Please wait while your session and workspace state are being confirmed."
            tone="default"
          />
        </SectionStack>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Welcome"
      subtitle="Start using Naija Tax Guide with a clear understanding of your plan, credits, channels, and the main workspace sections."
      actions={
        <ActionGrid>
          <button onClick={handleContinue} style={{ ...shellButtonPrimary(), width: "100%" }}>
            Continue to Dashboard
          </button>

          <button onClick={handleAskPage} style={{ ...shellButtonSecondary(), width: "100%" }}>
            Go to Ask Page
          </button>

          <button
            onClick={handleRefresh}
            disabled={busy}
            style={{ ...shellButtonSecondary(), width: "100%" }}
          >
            {busy ? "Refreshing..." : "Refresh"}
          </button>
        </ActionGrid>
      }
    >
      <SectionStack>
        <Banner
          title="Welcome page status"
          subtitle={status}
          tone={statusTone as "default" | "good" | "warn"}
        />

        <Banner
          title="You are now inside the product"
          subtitle="This page is your first onboarding stop after access is confirmed. Once you continue, future visits can go straight to the dashboard unless you open welcome intentionally."
          tone="good"
        />

        {!activeNow ? (
          <Banner
            title="Subscription attention needed"
            subtitle="Your current subscription may be inactive. You can still review the workspace, but asking new questions may require active access."
            tone="warn"
          />
        ) : null}

        <Card>
          <div style={{ display: "grid", gap: 18 }}>
            <SectionHeader
              title="Workspace Overview"
              subtitle="This welcome page now shows subscription-and-credit visibility only. Daily AI usage and daily limit blocks have been removed."
            />

            <CardsGrid min={180}>
              <SafeMetricCard
                label="Current Plan"
                value={planDisplayName(planCode)}
                tone="default"
              />

              <SafeMetricCard
                label="Credits Available"
                value={String(creditBalance)}
                tone={
                  creditBalance <= 0
                    ? "danger"
                    : creditBalance <= 3
                      ? "warn"
                      : "good"
                }
              />

              <SafeMetricCard
                label="Access State"
                value={activeNow ? "Active" : "Inactive"}
                tone={activeNow ? "good" : "warn"}
              />

              <SafeMetricCard
                label="Current Expiry"
                value={formatDate(expiresAt)}
                tone="default"
              />
            </CardsGrid>
          </div>
        </Card>

        <Card>
          <div style={{ display: "grid", gap: 18 }}>
            <SectionHeader
              title="Start Here"
              subtitle="Use these steps to begin using the product properly."
            />

            <CardsGrid min={220}>
              <WelcomeStep
                number="1"
                title="Open the Ask page"
                description="Submit one tax question at a time and receive a structured response inside your workspace."
              />
              <WelcomeStep
                number="2"
                title="Track your credits"
                description="Your account uses subscription access and available AI credits to determine question readiness."
              />
              <WelcomeStep
                number="3"
                title="Manage plans and billing"
                description="Use Plans and Billing to review your current package, renewal state, and payment visibility."
              />
            </CardsGrid>
          </div>
        </Card>

        <Card>
          <div style={{ display: "grid", gap: 18 }}>
            <SectionHeader
              title="Main Workspace Areas"
              subtitle="These are the most important parts of Version 1."
            />

            <CardsGrid min={220}>
              <ShortcutCard
                title="Ask Tax AI"
                subtitle="Submit your next tax question and receive guided assistance."
                tone={
                  !activeNow
                    ? "warn"
                    : creditBalance <= 0
                      ? "danger"
                      : "good"
                }
                onClick={() => router.push("/ask")}
              />

              <ShortcutCard
                title="History"
                subtitle="Review previous questions and continue from where you stopped."
                tone="default"
                onClick={() => router.push("/history")}
              />

              <ShortcutCard
                title="Credits"
                subtitle="Check your current available AI credits."
                tone={
                  creditBalance <= 0
                    ? "danger"
                    : creditBalance <= 3
                      ? "warn"
                      : "good"
                }
                onClick={() => router.push("/credits")}
              />

              <ShortcutCard
                title="Billing"
                subtitle="Review subscription state, payment visibility, and billing readiness."
                tone="default"
                onClick={() => router.push("/billing")}
              />

              <ShortcutCard
                title="Plans"
                subtitle="Upgrade, renew, or review your current subscription plan."
                tone={!activeNow ? "warn" : "default"}
                onClick={() => router.push("/plans")}
              />

              <ShortcutCard
                title="Channels"
                subtitle="See how web, WhatsApp, and Telegram fit into your account model."
                tone="default"
                onClick={() => router.push("/channels")}
              />
            </CardsGrid>
          </div>
        </Card>

        <TwoColumnSection>
          <Card>
            <div style={{ display: "grid", gap: 18 }}>
              <SectionHeader
                title="Version 1 Access Channels"
                subtitle="The first release is centered around a single account model across supported access surfaces."
              />

              <div style={{ display: "grid", gap: 12 }}>
                <SafeMetricCard
                  label="Web Portal"
                  value="Active Workspace"
                  tone="good"
                  helper="Main place for account, billing, credits, history, help, and question management."
                />

                <SafeMetricCard
                  label="WhatsApp"
                  value="Version 1"
                  tone="default"
                  helper="Mobile-first guided access under the same account model."
                />

                <SafeMetricCard
                  label="Telegram"
                  value="Version 1"
                  tone="default"
                  helper="Bot-based structured access under the same product identity."
                />
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ display: "grid", gap: 18 }}>
              <SectionHeader
                title="Important Notes"
                subtitle="Keep these rules in mind while using the platform."
              />

              <div
                style={{
                  display: "grid",
                  gap: 10,
                  color: "var(--text-muted)",
                  fontSize: 14,
                  lineHeight: 1.75,
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                }}
              >
                <div>
                  1. Naija Tax Guide provides guided tax help, not official legal representation.
                </div>
                <div>
                  2. Highly sensitive or advanced cases may still require a qualified professional.
                </div>
                <div>
                  3. Your current plan and available credits determine whether you can continue asking questions smoothly.
                </div>
                <div>
                  4. Supported channels are intended to work under one account, one plan, and one shared credit balance.
                </div>
              </div>
            </div>
          </Card>
        </TwoColumnSection>

        <TwoColumnSection>
          <Card>
            <div style={{ display: "grid", gap: 18 }}>
              <SectionHeader
                title="Recommended First Actions"
                subtitle="Best next steps for a new or returning user."
              />

              <ActionGrid>
                <button onClick={handleContinue} style={{ ...shellButtonPrimary(), width: "100%" }}>
                  Continue to Dashboard
                </button>

                <button
                  onClick={() => router.push("/ask")}
                  style={{ ...shellButtonSecondary(), width: "100%" }}
                >
                  Ask Your First Question
                </button>

                <button
                  onClick={() => router.push("/plans")}
                  style={{ ...shellButtonSecondary(), width: "100%" }}
                >
                  Review Plans
                </button>

                <button
                  onClick={() => router.push("/help")}
                  style={{ ...shellButtonSecondary(), width: "100%" }}
                >
                  Open Help Center
                </button>
              </ActionGrid>
            </div>
          </Card>

          <Card>
            <div style={{ display: "grid", gap: 18 }}>
              <SectionHeader
                title="Account Snapshot"
                subtitle="Quick user-facing summary of your current workspace."
              />

              <div style={{ display: "grid", gap: 12 }}>
                <SafeMetricCard
                  label="Visible Email"
                  value={email || "Not available"}
                  tone="default"
                />

                <SafeMetricCard
                  label="Account ID"
                  value={accountId || "Not available"}
                  tone="default"
                />

                <SafeMetricCard
                  label="Current Plan"
                  value={planDisplayName(planCode)}
                  tone="default"
                />

                <SafeMetricCard
                  label="Credits Available"
                  value={String(creditBalance)}
                  tone={
                    creditBalance <= 0
                      ? "danger"
                      : creditBalance <= 3
                        ? "warn"
                        : "good"
                  }
                />
              </div>
            </div>
          </Card>
        </TwoColumnSection>
      </SectionStack>
    </AppShell>
  );
}

function WelcomePageFallback() {
  return (
    <AppShell
      title="Welcome"
      subtitle="Preparing your onboarding workspace..."
    >
      <SectionStack>
        <Banner
          title="Preparing welcome page"
          subtitle="Please wait while your session and workspace state are being confirmed."
          tone="default"
        />
      </SectionStack>
    </AppShell>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<WelcomePageFallback />}>
      <WelcomePageContent />
    </Suspense>
  );
}
