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
  guard?: {
    access?: {
      allowed?: boolean;
    };
    plan_code?: string | null;
    daily_answers_limit?: number;
  } | null;
  plan_code?: string | null;
  plan_name?: string | null;
  status?: string | null;
  active?: boolean | null;
  starts_at?: string | null;
  started_at?: string | null;
  expires_at?: string | null;
  current_period_end?: string | null;
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
  credit_balance?: number | null;
  credit_exists?: boolean | null;
  credit_updated_at?: string | null;
  daily_usage_count?: number | null;
  daily_answers_limit?: number | null;
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
  includeLinkStatus?: boolean;
  loadingMessage?: string;
  revalidateSessionOnLoad?: boolean;
};

type WorkspaceLinkStatusResp = {
  ok?: boolean;
  account_id?: string;
  telegram?: { linked?: boolean; provider_user_id?: string | null; display_name?: string | null; updated_at?: string | null; is_verified?: boolean | null } | null;
  whatsapp?: { linked?: boolean; provider_user_id?: string | null; display_name?: string | null; updated_at?: string | null; is_verified?: boolean | null } | null;
  error?: string;
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
    includeLinkStatus = true,
    loadingMessage = "Loading workspace...",
    revalidateSessionOnLoad = false,
  } = options || {};

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(loadingMessage);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const [accountRaw, setAccountRaw] = useState<WorkspaceAccountResp | null>(null);
  const [billingRaw, setBillingRaw] = useState<WorkspaceBillingResp | null>(null);
  const [debugStateRaw, setDebugStateRaw] = useState<WorkspaceDebugStateResp | null>(null);
  const [linkStatusRaw, setLinkStatusRaw] = useState<WorkspaceLinkStatusResp | null>(null);

  const load = useCallback(
    async (nextLoadingMessage?: string) => {
      setBusy(true);
      setStatus(nextLoadingMessage || loadingMessage);
      setErrorDetails(null);

      try {
        console.log("🔍 [useWorkspaceState] Starting load...");
        
        if (refreshSession && revalidateSessionOnLoad) {
          try {
            console.log("🔍 [useWorkspaceState] Refreshing session...");
            const sessionValid = await refreshSession();
            console.log(`🔍 [useWorkspaceState] Session valid: ${sessionValid}`);
            if (!sessionValid) {
              console.warn("⚠️ [useWorkspaceState] Session not valid, skipping account load");
              setBusy(false);
              return;
            }
          } catch (err) {
            console.error("❌ [useWorkspaceState] Session refresh error:", err);
          }
        }

        // Small delay to ensure session is fully set
        console.log("🔍 [useWorkspaceState] Waiting 500ms for session...");
        await new Promise(resolve => setTimeout(resolve, 500));

        const accountRequest: Promise<WorkspaceAccountResp | null> = includeAccount
          ? apiJson<WorkspaceAccountResp>("web/auth/me", {
              method: "GET",
              timeoutMs: 20000,
              useAuthToken: false,
            }).catch((err) => {
              console.error("❌ [useWorkspaceState] Account request failed:", err);
              setErrorDetails(`Account request failed: ${err.message || JSON.stringify(err)}`);
              return null;
            })
          : Promise.resolve(null);

        const billingRequest: Promise<WorkspaceBillingResp | null> = includeBilling
          ? apiJson<WorkspaceBillingResp>("billing/me", {
              method: "GET",
              timeoutMs: 20000,
              useAuthToken: false,
            }).catch((err) => {
              console.error("❌ [useWorkspaceState] Billing request failed:", err);
              return null;
            })
          : Promise.resolve(null);

        const debugRequest: Promise<WorkspaceDebugStateResp | null> = includeDebug
          ? apiJson<WorkspaceDebugStateResp>("billing/debug-state", {
              method: "GET",
              timeoutMs: 20000,
              useAuthToken: false,
            }).catch((err) => {
              console.error("❌ [useWorkspaceState] Debug request failed:", err);
              return null;
            })
          : Promise.resolve(null);

        const linkStatusRequest: Promise<WorkspaceLinkStatusResp | null> = includeLinkStatus
          ? apiJson<WorkspaceLinkStatusResp>("link/status", { method: "GET", timeoutMs: 20000, useAuthToken: false }).catch((err) => {
              console.error("❌ [useWorkspaceState] Link status request failed:", err);
              return null;
            })
          : Promise.resolve(null);

        console.log("🔍 [useWorkspaceState] Sending parallel requests...");
        const [accountResult, billingResult, debugResult, linkStatusResult] = await Promise.all([
          accountRequest,
          billingRequest,
          debugRequest,
          linkStatusRequest,
        ]);

        console.log("🔍 [useWorkspaceState] Account result:", JSON.stringify(accountResult, null, 2));
        
        if (accountResult) {
          setAccountRaw(accountResult);
          // Extract account_id from the response
          if (accountResult.account_id) {
            console.log("✅ [useWorkspaceState] Setting accountId to:", accountResult.account_id);
            setAccountId(accountResult.account_id);
          } else {
            console.warn("⚠️ [useWorkspaceState] accountResult has no account_id:", accountResult);
            setErrorDetails("API returned success but no account_id field");
          }
        } else {
          console.error("❌ [useWorkspaceState] accountResult is null");
          setErrorDetails("Account API request returned null");
        }
        
        if (billingResult) {
          console.log("✅ [useWorkspaceState] Billing result received");
          setBillingRaw(billingResult);
        }
        if (debugResult) {
          console.log("✅ [useWorkspaceState] Debug result received");
          setDebugStateRaw(debugResult);
        }
        if (linkStatusResult) {
          console.log("✅ [useWorkspaceState] Link status result received");
          setLinkStatusRaw(linkStatusResult);
        }

        const successCount = [accountResult, billingResult, debugResult, linkStatusResult].filter(Boolean).length;
        console.log(`🔍 [useWorkspaceState] Success count: ${successCount}/4`);

        if (successCount >= 2) {
          setStatus("Ready.");
        } else if (successCount === 1) {
          setStatus("Workspace partially loaded.");
        } else {
          setStatus("Workspace load failed.");
        }
      } catch (error) {
        console.error("❌ [useWorkspaceState] Workspace load error:", error);
        setStatus("Workspace load failed.");
        setErrorDetails(error instanceof Error ? error.message : String(error));
      } finally {
        setBusy(false);
        console.log("🔍 [useWorkspaceState] Load completed. accountId:", accountId);
      }
    },
    [
      refreshSession,
      includeAccount,
      includeBilling,
      includeDebug,
      includeLinkStatus,
      loadingMessage,
      revalidateSessionOnLoad,
      accountId,
    ]
  );

  useEffect(() => {
    if (!autoLoad) return;
    console.log("🔍 [useWorkspaceState] Auto-load triggered");
    void load();
  }, [autoLoad, load]);

  const sub = billingRaw?.subscription || null;
  const summary = billingRaw?.subscription_summary || null;
  const guard = billingRaw?.guard || pickGuard(debugStateRaw);

  const derived = useMemo(() => {
    const finalAccountId =
      accountId ||
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

    const creditBalance = safeNumber(
      debugStateRaw?.credit_balance?.balance,
      safeNumber(billingRaw?.credit_balance, 0)
    );
    const creditUsed =
      safeNumber(debugStateRaw?.credit_balance?.used, 0) ||
      safeNumber(debugStateRaw?.credit_balance?.consumed, 0);

    const dailyUsage =
      safeNumber(debugStateRaw?.daily_usage_today?.count, 0) ||
      safeNumber(debugStateRaw?.daily_usage_today?.daily_usage, 0) ||
      safeNumber(billingRaw?.daily_usage_count, 0);

    const dailyLimit = safeNumber(
      guard?.daily_answers_limit,
      safeNumber(billingRaw?.daily_answers_limit, 0)
    );
    const usageRemaining = dailyLimit > 0 ? Math.max(dailyLimit - dailyUsage, 0) : null;

    const profile: WorkspaceProfile = {
      id: finalAccountId,
      account_id: finalAccountId,
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
      updated_at:
        safeText(debugStateRaw?.credit_balance?.updated_at) ||
        safeText(billingRaw?.credit_updated_at),
      last_updated_at: safeText(debugStateRaw?.credit_balance?.last_updated_at),
    };

    const usage: WorkspaceUsage = {
      count: dailyUsage,
      limit: dailyLimit,
      remaining: usageRemaining,
      daily_usage: dailyUsage,
      used_this_month: Math.max(
        safeNumber(billing.ai_used_month, 0),
        safeNumber(credits.used_this_month, 0)
      ),
      monthly_used: Math.max(
        safeNumber(billing.ai_used_month, 0),
        safeNumber(credits.used_this_month, 0)
      ),
      ai_used_month: Math.max(
        safeNumber(billing.ai_used_month, 0),
        safeNumber(credits.used_this_month, 0)
      ),
    };

    const whatsappLinked = truthyValue(linkStatusRaw?.whatsapp?.linked ?? debugStateRaw?.whatsapp_linked);
    const telegramLinked = truthyValue(linkStatusRaw?.telegram?.linked ?? debugStateRaw?.telegram_linked);
    const whatsappVerified = truthyValue(linkStatusRaw?.whatsapp?.is_verified ?? debugStateRaw?.whatsapp_verified);
    const telegramVerified = truthyValue(linkStatusRaw?.telegram?.is_verified ?? debugStateRaw?.telegram_verified);

    const whatsappNumber = safeText(linkStatusRaw?.whatsapp?.provider_user_id) || safeText(debugStateRaw?.whatsapp_number);
    const telegramUsername = safeText(linkStatusRaw?.telegram?.provider_user_id) || safeText(debugStateRaw?.telegram_username);
    const whatsappUpdatedAt = safeText(linkStatusRaw?.whatsapp?.updated_at) || safeText(debugStateRaw?.whatsapp_updated_at);
    const telegramUpdatedAt = safeText(linkStatusRaw?.telegram?.updated_at) || safeText(debugStateRaw?.telegram_updated_at);

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
      accountId: finalAccountId,
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
      errorDetails,
    };
  }, [accountId, accountRaw, billingRaw, debugStateRaw, sub, summary, guard, linkStatusRaw, errorDetails]);

  const refreshAll = useCallback(async () => {
    await load("Refreshing workspace...");
  }, [load]);

  return {
    busy,
    status,
    accountId,
    errorDetails,
    accountRaw,
    billingRaw,
    debugStateRaw,
    load,
    refreshAll,
    ...derived,
  };
}
