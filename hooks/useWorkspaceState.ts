"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiJson } from "@/lib/api";

export type WorkspaceAccountResp = {
  ok?: boolean;
  account_id?: string;
  email?: string | null;
  error?: string;
};

export type WorkspaceBillingResp = {
  ok?: boolean;
  account_id?: string;
  subscription?: {
    id?: string;
    account_id?: string;
    plan_code?: string;
    status?: string;
    is_active?: boolean;
    started_at?: string | null;
    expires_at?: string | null;
    current_period_end?: string | null;
    provider?: string | null;
    provider_ref?: string | null;
    pending_plan_code?: string | null;
    pending_starts_at?: string | null;
  } | null;
  subscription_summary?: {
    is_active_now?: boolean;
    has_pending_change?: boolean;
    current_plan_code?: string | null;
  } | null;
  checkout_email?: string | null;
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
  } | null;
  daily_usage_today?: {
    count?: number;
  } | null;
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

function safeNumber(value: any, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
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
            // ignore here; page-level auth should not be destabilized by background refresh
          }
        }

        const requests: Promise<any>[] = [];

        if (includeAccount) {
          requests.push(
            apiJson<WorkspaceAccountResp>("/web/auth/me", {
              method: "GET",
              timeoutMs: 20000,
              useAuthToken: false,
            }).catch(() => null)
          );
        } else {
          requests.push(Promise.resolve(null));
        }

        if (includeBilling) {
          requests.push(
            apiJson<WorkspaceBillingResp>("/billing/me", {
              method: "GET",
              timeoutMs: 20000,
              useAuthToken: false,
            }).catch(() => null)
          );
        } else {
          requests.push(Promise.resolve(null));
        }

        if (includeDebug) {
          requests.push(
            apiJson<WorkspaceDebugStateResp>("/billing/debug-state", {
              method: "GET",
              timeoutMs: 20000,
              useAuthToken: false,
            }).catch(() => null)
          );
        } else {
          requests.push(Promise.resolve(null));
        }

        const [accountResult, billingResult, debugResult] = await Promise.all(requests);

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
    load();
  }, [autoLoad, load]);

  const sub = billingRaw?.subscription || null;
  const summary = billingRaw?.subscription_summary || null;
  const guard = pickGuard(debugStateRaw);

  const derived = useMemo(() => {
    const accountId =
      accountRaw?.account_id ||
      billingRaw?.account_id ||
      debugStateRaw?.account_id ||
      "—";

    const email = accountRaw?.email || billingRaw?.checkout_email || "—";

    const activeNow =
      Boolean(summary?.is_active_now) ||
      Boolean(guard?.access?.allowed) ||
      (Boolean(sub?.is_active) && String(sub?.status || "").toLowerCase() === "active");

    const planCode =
      sub?.plan_code ||
      summary?.current_plan_code ||
      guard?.plan_code ||
      "";

    const creditBalance = safeNumber(debugStateRaw?.credit_balance?.balance, 0);
    const dailyUsage = safeNumber(debugStateRaw?.daily_usage_today?.count, 0);
    const dailyLimit = safeNumber(guard?.daily_answers_limit, 0);
    const usageRemaining = dailyLimit > 0 ? Math.max(dailyLimit - dailyUsage, 0) : null;

    return {
      accountId,
      email,
      sub,
      summary,
      guard,
      activeNow,
      planCode,
      creditBalance,
      dailyUsage,
      dailyLimit,
      usageRemaining,
      expiresAt: sub?.expires_at || null,
      currentPeriodEnd: sub?.current_period_end || null,
      checkoutEmail: billingRaw?.checkout_email || null,
      pendingPlanCode: sub?.pending_plan_code || null,
      pendingStartsAt: sub?.pending_starts_at || null,
    };
  }, [accountRaw, billingRaw, debugStateRaw, sub, summary, guard]);

  return {
    busy,
    status,
    accountRaw,
    billingRaw,
    debugStateRaw,
    load,
    ...derived,
  };
}