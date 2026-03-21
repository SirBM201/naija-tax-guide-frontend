"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiJson } from "@/lib/api";

export type WorkspaceAccountResp = {
  ok?: boolean;
  account_id?: string;
  email?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  first_name?: string | null;
  error?: string;
};

export type WorkspaceBillingSubscription = {
  id?: string;
  account_id?: string;
  plan_code?: string;
  plan_name?: string | null;
  status?: string;
  is_active?: boolean;
  active?: boolean;
  started_at?: string | null;
  starts_at?: string | null;
  expires_at?: string | null;
  current_period_end?: string | null;
  provider?: string | null;
  provider_ref?: string | null;
  provider_name?: string | null;
  payment_method?: string | null;
  payment_reference?: string | null;
  last_payment_reference?: string | null;
  pending_plan_code?: string | null;
  pending_starts_at?: string | null;
  auto_renew?: boolean | null;
  included_credits?: number | null;
  ai_used_month?: number | null;
};

export type WorkspaceBillingResp = {
  ok?: boolean;
  account_id?: string;
  subscription?: WorkspaceBillingSubscription | null;
  subscription_summary?: {
    is_active_now?: boolean;
    has_pending_change?: boolean;
    current_plan_code?: string | null;
  } | null;
  checkout_email?: string | null;
  plan_code?: string | null;
  plan_name?: string | null;
  status?: string | null;
  active?: boolean | null;
  expires_at?: string | null;
  pending_plan_code?: string | null;
  pending_starts_at?: string | null;
  payment_reference?: string | null;
  last_payment_reference?: string | null;
  payment_method?: string | null;
  provider?: string | null;
  provider_name?: string | null;
  auto_renew?: boolean | null;
  included_credits?: number | null;
  ai_used_month?: number | null;
  error?: string;
};

export type WorkspaceDebugStateResp = {
  ok?: boolean;
  account_id?: string;
  subscription_guard_snapshot?: {
    access?: {
      allowed?: boolean;
    };
    plan_code?: string | null;
    daily_answers_limit?: number;
  } | null;
  guard?: {
    access?: {
      allowed?: boolean;
    };
    plan_code?: string | null;
    daily_answers_limit?: number;
  } | null;
  credit_balance?: {
    balance?: number;
    used?: number;
    consumed?: number;
    updated_at?: string | null;
    last_updated_at?: string | null;
    used_this_month?: number;
  } | null;
  daily_usage_today?: {
    count?: number;
    daily_usage?: number;
  } | null;
  whatsapp_linked?: boolean;
  telegram_linked?: boolean;
  whatsapp_verified?: boolean;
  telegram_verified?: boolean;
  whatsapp_number?: string | null;
  telegram_username?: string | null;
  whatsapp_updated_at?: string | null;
  telegram_updated_at?: string | null;
  error?: string;
};

type UseWorkspaceStateOptions = {
  refreshSession?: () => Promise<boolean>;
  autoLoad?: boolean;
  includeAccount?: boolean;
  includeBilling?: boolean;
  includeDebug?: boolean;
  loadingMessage?: string;
  revalidateSessionOnLoad?: boolean;
};

type WorkspaceProfile = {
  id: string;
  account_id: string;
  email: string | null;
  full_name: string | null;
  display_name: string | null;
  first_name: string | null;
};

type WorkspaceUsage = {
  count: number;
  limit: number;
  remaining: number | null;
  daily_usage: number;
  used_this_month: number;
  monthly_used: number;
  ai_used_month: number;
};

type WorkspaceCredits = {
  balance: number;
  used: number;
  consumed: number;
  used_this_month: number;
  updated_at: string | null;
  last_updated_at: string | null;
};

type ChannelValue = {
  linked: boolean;
  verified: boolean;
  is_verified: boolean;
  value: string | null;
  phone?: string | null;
  username?: string | null;
  updated_at: string | null;
};

type WorkspaceChannelLinks = {
  whatsapp_linked: boolean;
  telegram_linked: boolean;
  whatsapp_verified: boolean;
  telegram_verified: boolean;
  whatsapp_number: string | null;
  telegram_username: string | null;
  whatsapp_updated_at: string | null;
  telegram_updated_at: string | null;
  whatsapp: ChannelValue;
  telegram: ChannelValue;
};

type WorkspaceBillingView = {
  checkout_email: string | null;
  subscription: WorkspaceBillingSubscription | null;
  subscription_summary: WorkspaceBillingResp["subscription_summary"] | null;
  plan_code: string | null;
  plan_name: string | null;
  status: string | null;
  active: boolean;
  expires_at: string | null;
  pending_plan_code: string | null;
  pending_starts_at: string | null;
  payment_reference: string | null;
  last_payment_reference: string | null;
  payment_method: string | null;
  provider: string | null;
  provider_name: string | null;
  auto_renew: boolean;
  included_credits: number;
  ai_used_month: number;
  starts_at: string | null;
};

function safeNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function safeText(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function truthyValue(value: unknown) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function pickGuard(debugStateRaw: WorkspaceDebugStateResp | null) {
  if (!debugStateRaw) return null;
  return debugStateRaw.subscription_guard_snapshot || debugStateRaw.guard || null;
}

export function useWorkspaceState(options?: UseWorkspaceStateOptions) {
  const {
    refreshSession,
    autoLoad = true,
    includeAccount = true,
    includeBilling = true,
    includeDebug = true,
    loadingMessage = "Loading workspace...",
    revalidateSessionOnLoad = false,
  } = options || {};

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(loadingMessage);

  const [accountRaw, setAccountRaw] = useState<WorkspaceAccountResp | null>(null);
  const [billingRaw, setBillingRaw] = useState<WorkspaceBillingResp | null>(null);
  const [debugStateRaw, setDebugStateRaw] = useState<WorkspaceDebugStateResp | null>(null);

  const load = useCallback(
    async (nextLoadingMessage?: string) => {
      setBusy(true);
      setStatus(nextLoadingMessage || loadingMessage);

      try {
        if (refreshSession && revalidateSessionOnLoad) {
          try {
            await refreshSession();
          } catch {
            // ignore
          }
        }

        const accountRequest: Promise<WorkspaceAccountResp | null> = includeAccount
          ? apiJson<WorkspaceAccountResp>("/web/auth/me", {
              method: "GET",
              timeoutMs: 20000,
              useAuthToken: false,
            }).catch(() => null)
          : Promise.resolve(null);

        const billingRequest: Promise<WorkspaceBillingResp | null> = includeBilling
          ? apiJson<WorkspaceBillingResp>("/billing/me", {
              method: "GET",
              timeoutMs: 20000,
              useAuthToken: false,
            }).catch(() => null)
          : Promise.resolve(null);

        const debugRequest: Promise<WorkspaceDebugStateResp | null> = includeDebug
          ? apiJson<WorkspaceDebugStateResp>("/billing/debug-state", {
              method: "GET",
              timeoutMs: 20000,
              useAuthToken: false,
            }).catch(() => null)
          : Promise.resolve(null);

        const [accountResult, billingResult, debugResult] = await Promise.all([
          accountRequest,
          billingRequest,
          debugRequest,
        ]);

        if (accountResult) setAccountRaw(accountResult);
        if (billingResult) setBillingRaw(billingResult);
        if (debugResult) setDebugStateRaw(debugResult);

        const successCount = [accountResult, billingResult, debugResult].filter(Boolean).length;

        if (successCount >= 2) {
          setStatus("Ready.");
        } else if (successCount === 1) {
          setStatus("Workspace partially loaded.");
        } else {
          setStatus("Workspace load failed.");
        }
      } catch {
        setStatus("Workspace load failed.");
      } finally {
        setBusy(false);
      }
    },
    [
      refreshSession,
      includeAccount,
      includeBilling,
      includeDebug,
      loadingMessage,
      revalidateSessionOnLoad,
    ]
  );

  useEffect(() => {
    if (!autoLoad) return;
    void load();
  }, [autoLoad, load]);

  const sub = billingRaw?.subscription || null;
  const summary = billingRaw?.subscription_summary || null;
  const guard = pickGuard(debugStateRaw);

  const derived = useMemo(() => {
    const accountId =
      accountRaw?.account_id ||
      billingRaw?.account_id ||
      debugStateRaw?.account_id ||
      "";

    const email = accountRaw?.email || billingRaw?.checkout_email || null;

    const activeNow =
      Boolean(summary?.is_active_now) ||
      Boolean(guard?.access?.allowed) ||
      truthyValue(sub?.active) ||
      Boolean(sub?.is_active) ||
      truthyValue(billingRaw?.active) ||
      String(sub?.status || billingRaw?.status || "").toLowerCase() === "active";

    const planCode =
      safeText(sub?.plan_code) ||
      safeText(billingRaw?.plan_code) ||
      safeText(summary?.current_plan_code) ||
      safeText(guard?.plan_code) ||
      "";

    const planName =
      safeText(sub?.plan_name) ||
      safeText(billingRaw?.plan_name) ||
      planCode ||
      null;

    const creditBalance = safeNumber(debugStateRaw?.credit_balance?.balance, 0);
    const creditUsed =
      safeNumber(debugStateRaw?.credit_balance?.used, 0) ||
      safeNumber(debugStateRaw?.credit_balance?.consumed, 0);

    const dailyUsage =
      safeNumber(debugStateRaw?.daily_usage_today?.count, 0) ||
      safeNumber(debugStateRaw?.daily_usage_today?.daily_usage, 0);

    const dailyLimit = safeNumber(guard?.daily_answers_limit, 0);
    const usageRemaining = dailyLimit > 0 ? Math.max(dailyLimit - dailyUsage, 0) : null;

    const profile: WorkspaceProfile = {
      id: accountId,
      account_id: accountId,
      email,
      full_name: accountRaw?.full_name || null,
      display_name: accountRaw?.display_name || accountRaw?.full_name || null,
      first_name:
        accountRaw?.first_name || accountRaw?.display_name || accountRaw?.full_name || null,
    };

    const subscription: WorkspaceBillingSubscription | null = sub
      ? {
          ...sub,
          active: truthyValue(sub.active) || Boolean(sub.is_active),
          starts_at: sub.starts_at || sub.started_at || null,
          plan_name: sub.plan_name || planName,
          included_credits: safeNumber(
            sub.included_credits,
            safeNumber(billingRaw?.included_credits, 0)
          ),
          ai_used_month: safeNumber(
            sub.ai_used_month,
            safeNumber(billingRaw?.ai_used_month, 0)
          ),
          auto_renew: truthyValue(sub.auto_renew),
        }
      : null;

    const billing: WorkspaceBillingView = {
      checkout_email: billingRaw?.checkout_email || null,
      subscription,
      subscription_summary: summary,
      plan_code: planCode || null,
      plan_name: planName,
      status: safeText(sub?.status) || safeText(billingRaw?.status) || null,
      active: activeNow,
      expires_at: safeText(sub?.expires_at) || safeText(billingRaw?.expires_at) || null,
      pending_plan_code:
        safeText(sub?.pending_plan_code) || safeText(billingRaw?.pending_plan_code) || null,
      pending_starts_at:
        safeText(sub?.pending_starts_at) || safeText(billingRaw?.pending_starts_at) || null,
      payment_reference:
        safeText(billingRaw?.payment_reference) || safeText(sub?.payment_reference) || null,
      last_payment_reference:
        safeText(billingRaw?.last_payment_reference) ||
        safeText(sub?.last_payment_reference) ||
        null,
      payment_method:
        safeText(billingRaw?.payment_method) || safeText(sub?.payment_method) || null,
      provider: safeText(billingRaw?.provider) || safeText(sub?.provider) || null,
      provider_name:
        safeText(billingRaw?.provider_name) || safeText(sub?.provider_name) || null,
      auto_renew: truthyValue(billingRaw?.auto_renew) || truthyValue(sub?.auto_renew),
      included_credits: safeNumber(
        billingRaw?.included_credits,
        safeNumber(sub?.included_credits, 0)
      ),
      ai_used_month: safeNumber(
        billingRaw?.ai_used_month,
        safeNumber(sub?.ai_used_month, 0)
      ),
      starts_at: safeText(sub?.starts_at) || safeText(sub?.started_at) || null,
    };

    const credits: WorkspaceCredits = {
      balance: creditBalance,
      used: creditUsed,
      consumed: creditUsed,
      used_this_month: safeNumber(debugStateRaw?.credit_balance?.used_this_month, creditUsed),
      updated_at: safeText(debugStateRaw?.credit_balance?.updated_at),
      last_updated_at: safeText(debugStateRaw?.credit_balance?.last_updated_at),
    };

    const usage: WorkspaceUsage = {
      count: dailyUsage,
      limit: dailyLimit,
      remaining: usageRemaining,
      daily_usage: dailyUsage,
      used_this_month: safeNumber(
        billing.ai_used_month,
        safeNumber(credits.used_this_month, 0)
      ),
      monthly_used: safeNumber(
        billing.ai_used_month,
        safeNumber(credits.used_this_month, 0)
      ),
      ai_used_month: safeNumber(
        billing.ai_used_month,
        safeNumber(credits.used_this_month, 0)
      ),
    };

    const whatsappLinked = truthyValue(debugStateRaw?.whatsapp_linked);
    const telegramLinked = truthyValue(debugStateRaw?.telegram_linked);
    const whatsappVerified = truthyValue(debugStateRaw?.whatsapp_verified);
    const telegramVerified = truthyValue(debugStateRaw?.telegram_verified);

    const whatsappNumber = safeText(debugStateRaw?.whatsapp_number);
    const telegramUsername = safeText(debugStateRaw?.telegram_username);
    const whatsappUpdatedAt = safeText(debugStateRaw?.whatsapp_updated_at);
    const telegramUpdatedAt = safeText(debugStateRaw?.telegram_updated_at);

    const channelLinks: WorkspaceChannelLinks = {
      whatsapp_linked: whatsappLinked,
      telegram_linked: telegramLinked,
      whatsapp_verified: whatsappVerified,
      telegram_verified: telegramVerified,
      whatsapp_number: whatsappNumber,
      telegram_username: telegramUsername,
      whatsapp_updated_at: whatsappUpdatedAt,
      telegram_updated_at: telegramUpdatedAt,
      whatsapp: {
        linked: whatsappLinked,
        verified: whatsappVerified,
        is_verified: whatsappVerified,
        value: whatsappNumber,
        phone: whatsappNumber,
        updated_at: whatsappUpdatedAt,
      },
      telegram: {
        linked: telegramLinked,
        verified: telegramVerified,
        is_verified: telegramVerified,
        value: telegramUsername,
        username: telegramUsername,
        updated_at: telegramUpdatedAt,
      },
    };

    return {
      accountId,
      email,
      sub: subscription,
      summary,
      guard,
      activeNow,
      planCode,
      creditBalance,
      dailyUsage,
      dailyLimit,
      usageRemaining,
      expiresAt: subscription?.expires_at || null,
      currentPeriodEnd: subscription?.current_period_end || null,
      checkoutEmail: billing.checkout_email,
      pendingPlanCode: billing.pending_plan_code,
      pendingStartsAt: billing.pending_starts_at,
      profile,
      subscription,
      billing,
      credits,
      usage,
      channelLinks,
    };
  }, [accountRaw, billingRaw, debugStateRaw, sub, summary, guard]);

  const refreshAll = useCallback(async () => {
    await load("Refreshing workspace...");
  }, [load]);

  return {
    busy,
    status,
    accountRaw,
    billingRaw,
    debugStateRaw,
    load,
    refreshAll,
    ...derived,
  };
}