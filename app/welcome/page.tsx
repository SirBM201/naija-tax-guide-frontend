"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell, {
  shellButtonPrimary,
  shellButtonSecondary,
} from "@/components/app-shell";
import WorkspaceOverviewMetrics from "@/components/workspace-overview-metrics";
import {
  Banner,
  Card,
  MetricCard,
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
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 14,
          color: "var(--text-muted)",
          lineHeight: 1.7,
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
    <div style={{ display: "grid", gap: 6 }}>
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "var(--text)",
          lineHeight: 1.4,
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
          }}
        >
          {subtitle}
        </div>
      ) : null}
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
    dailyUsage,
    dailyLimit,
    expiresAt,
  } = useWorkspaceState({
    autoLoad: false,
    includeAccount: true,
    includeBilling: true,
    includeDebug: true,
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

  const handleKeepForLater = () => {
    setWelcomeSeen(true);
    router.replace("/ask");
  };

  const handleRefresh = () => {
    void load("Loading welcome page...");
  };

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
      subtitle="Start using Naija Tax Guide with a clear understanding of how questions, credits, billing, and supported channels work together."
      actions={
        <>
          <button onClick={handleContinue} style={shellButtonPrimary()}>
            Continue to Dashboard
          </button>
          <button onClick={handleKeepForLater} style={shellButtonSecondary()}>
            Go to Ask Page
          </button>
          <button
            onClick={handleRefresh}
            disabled={busy}
            style={shellButtonSecondary()}
          >
            Refresh
          </button>
        </>
      }
    >
      <SectionStack>
        <Banner
          title="Welcome page status"
          subtitle={status}
          tone={
            status === "Ready."
              ? "good"
              : status.toLowerCase().includes("partial")
                ? "warn"
                : "default"
          }
        />

        <Banner
          title="You are now inside the product"
          subtitle="This page is your onboarding step after login. After the first visit, repeat users can go straight to the dashboard unless they open this page intentionally."
          tone="good"
        />

        {!activeNow ? (
          <Banner
            title="Subscription attention needed"
            subtitle="Your paid access may be inactive. You can still explore the workspace, but asking new questions may require an active subscription."
            tone="warn"
          />
        ) : null}

        <WorkspaceOverviewMetrics
          mode="welcome"
          accountId={accountId}
          email={email}
          activeNow={activeNow}
          planCode={planCode}
          creditBalance={creditBalance}
          dailyUsage={dailyUsage}
          dailyLimit={dailyLimit}
          expiresAt={expiresAt}
        />

        <Card>
          <div style={{ display: "grid", gap: 18 }}>
            <SectionHeader
              title="Start Here"
              subtitle="These are the main steps for using Naija Tax Guide confidently."
            />
            <CardsGrid min={260}>
              <WelcomeStep
                number="1"
                title="Ask your tax question"
                description="Use the Ask AI page to submit your question and receive a guided response based on your current access and usage state."
              />
              <WelcomeStep
                number="2"
                title="Track your credits and usage"
                description="Your account uses subscription access, AI credits, and daily usage visibility to manage how the assistant works."
              />
              <WelcomeStep
                number="3"
                title="Manage plans and channels"
                description="Review your plan, billing state, and the supported channels where your account can be used."
              />
            </CardsGrid>
          </div>
        </Card>

        <Card>
          <div style={{ display: "grid", gap: 18 }}>
            <SectionHeader
              title="Main Workspace Areas"
              subtitle="Use these shortcuts to move through the most important parts of the product."
            />
            <CardsGrid min={240}>
              <ShortcutCard
                title="Ask Tax AI"
                subtitle="Submit your next tax question and receive guided assistance."
                tone={!activeNow ? "warn" : creditBalance <= 0 ? "danger" : "good"}
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
                subtitle="Review current AI credits and daily usage visibility."
                tone={creditBalance <= 0 ? "danger" : creditBalance <= 3 ? "warn" : "good"}
                onClick={() => router.push("/credits")}
              />
              <ShortcutCard
                title="Billing"
                subtitle="Check subscription state, provider details, and payment readiness."
                tone="default"
                onClick={() => router.push("/billing")}
              />
              <ShortcutCard
                title="Plans"
                subtitle="Upgrade, renew, or manage your current subscription plan."
                tone={!activeNow ? "warn" : "default"}
                onClick={() => router.push("/plans")}
              />
              <ShortcutCard
                title="Channels"
                subtitle="See how web, WhatsApp, and Telegram fit into your account access."
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
                subtitle="The first release is centered around these user access surfaces."
              />
              <div style={{ display: "grid", gap: 12 }}>
                <MetricCard
                  label="Web Portal"
                  value="Active Workspace"
                  tone="good"
                  helper="Main place for account, billing, usage, and question management."
                />
                <MetricCard
                  label="WhatsApp"
                  value="Version 1"
                  helper="Mobile-first guided access planned under the same account and subscription."
                />
                <MetricCard
                  label="Telegram"
                  value="Version 1"
                  helper="Bot-based access planned under the same unified account model."
                />
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ display: "grid", gap: 18 }}>
              <SectionHeader
                title="Important Notes"
                subtitle="Keep these usage rules in mind while using the platform."
              />
              <div
                style={{
                  display: "grid",
                  gap: 10,
                  color: "var(--text-muted)",
                  fontSize: 14,
                  lineHeight: 1.75,
                }}
              >
                <div>
                  1. Naija Tax Guide provides guided tax help, not official legal representation.
                </div>
                <div>
                  2. Highly sensitive or advanced tax cases may still require a qualified professional.
                </div>
                <div>
                  3. Your credits, usage, and billing state determine access readiness for asking questions.
                </div>
                <div>
                  4. Supported channels should operate under one account, one plan, and one shared credit balance.
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
              <div style={{ display: "grid", gap: 12 }}>
                <button onClick={handleContinue} style={shellButtonPrimary()}>
                  Continue to Dashboard
                </button>
                <button
                  onClick={() => router.push("/ask")}
                  style={shellButtonSecondary()}
                >
                  Ask Your First Question
                </button>
                <button
                  onClick={() => router.push("/plans")}
                  style={shellButtonSecondary()}
                >
                  Review Plans
                </button>
                <button
                  onClick={() => router.push("/help")}
                  style={shellButtonSecondary()}
                >
                  Open Help Center
                </button>
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ display: "grid", gap: 18 }}>
              <SectionHeader
                title="Account Snapshot"
                subtitle="Quick user-facing summary of your current workspace."
              />
              <div style={{ display: "grid", gap: 12 }}>
                <MetricCard
                  label="Current Plan"
                  value={planDisplayName(planCode)}
                />
                <MetricCard
                  label="Subscription State"
                  value={activeNow ? "Active" : "Inactive"}
                  tone={activeNow ? "good" : "warn"}
                />
                <MetricCard
                  label="Credits Available"
                  value={String(creditBalance)}
                  tone={creditBalance <= 0 ? "danger" : "default"}
                />
                <MetricCard
                  label="Current Expiry"
                  value={formatDate(expiresAt)}
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