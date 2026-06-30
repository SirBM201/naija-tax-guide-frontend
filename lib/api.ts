import { CONFIG } from "@/lib/config";

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function isApiError(e: any): e is ApiError {
  return e instanceof ApiError;
}

type ApiInit = Omit<RequestInit, "body"> & {
  body?: any;
  query?: Record<string, string | number | boolean | null | undefined>;
  timeoutMs?: number;
  useAuthToken?: boolean;
};

const BILLING_CACHE_KEY = "ntg_last_active_billing";

function isPlainObject(v: any) {
  if (v === null || typeof v !== "object") return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

function normalizedApiPath(path: string) {
  return String(path || "").replace(/^\/+/, "").replace(/^api\//, "");
}

function safeGetLocalToken(): string | null {
  try {
    if (typeof window === "undefined") return null;
    
    const tokenKeys = [
      "nt_access_token",
      "web_token", 
      "token",
      "auth_token",
      "access_token",
      "sb-access-token",
      "sb-refresh-token"
    ];
    
    for (const key of tokenKeys) {
      const value = localStorage.getItem(key);
      if (value && value.trim() && value !== "undefined" && value !== "null") {
        return value.trim();
      }
    }
    
    for (const key of tokenKeys) {
      const value = sessionStorage.getItem(key);
      if (value && value.trim() && value !== "undefined" && value !== "null") {
        return value.trim();
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error reading from storage:", error);
    return null;
  }
}

export function clearStoredAuthToken() {
  try {
    if (typeof window === "undefined") return;
    const keys = ["nt_access_token", "web_token", "token", "auth_token", "access_token", "sb-access-token", "sb-refresh-token"];
    keys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  } catch {
    // ignore
  }
}

function buildUrl(path: string, query?: ApiInit["query"]) {
  const url = `/api/${normalizedApiPath(path)}`;

  if (query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v === null || v === undefined) continue;
      params.set(k, String(v));
    }
    const qs = params.toString();
    return qs ? `${url}?${qs}` : url;
  }

  return url;
}

function truthyValue(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    return ["1", "true", "yes", "active", "paid", "enabled"].includes(value.trim().toLowerCase());
  }
  return false;
}

function cleanText(value: unknown): string {
  return String(value || "").trim();
}

function planFamilyFromBilling(billing: any): string {
  const direct = cleanText(
    billing?.plan_family || billing?.subscription?.plan_family || billing?.plan?.plan_family || billing?.plan?.tier
  ).toLowerCase();
  if (direct && direct !== "free") return direct;

  const code = cleanText(
    billing?.plan_code || billing?.subscription?.plan_code || billing?.plan?.code
  ).toLowerCase();
  const name = cleanText(
    billing?.plan_name || billing?.subscription?.plan_name || billing?.plan?.name
  ).toLowerCase();
  const combined = `${code} ${name}`;

  if (combined.includes("business")) return "business";
  if (combined.includes("professional") || combined.includes("pro_")) return "professional";
  if (combined.includes("starter")) return "starter";
  return "free";
}

function planNameFromBilling(billing: any, family: string): string {
  const name = cleanText(billing?.plan_name || billing?.subscription?.plan_name || billing?.plan?.name);
  if (name && name.toLowerCase() !== "free") return name;

  const code = cleanText(billing?.plan_code || billing?.subscription?.plan_code || billing?.plan?.code);
  if (code && code.toLowerCase() !== "free") {
    return code.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }

  return family ? family.replace(/\b\w/g, (char) => char.toUpperCase()) : "Paid Plan";
}

function planCodeFromBilling(billing: any): string {
  return cleanText(billing?.plan_code || billing?.subscription?.plan_code || billing?.plan?.code).toLowerCase();
}

function isActivePaidBilling(billing: any): boolean {
  if (!isPlainObject(billing)) return false;
  const code = planCodeFromBilling(billing);
  const family = planFamilyFromBilling(billing);
  const status = cleanText(billing?.status || billing?.subscription?.status).toLowerCase();
  const active = truthyValue(
    billing?.active || billing?.is_active || billing?.subscription?.active || billing?.subscription?.is_active
  );

  return Boolean(
    code &&
      code !== "free" &&
      code !== "free_forever" &&
      family !== "free" &&
      (active || status === "active" || status === "paid")
  );
}

function limitBundleForFamily(family: string) {
  if (family === "business") {
    return {
      workspace_limits: { max_workspace_users: 10, max_linked_web_accounts: 10 },
      channel_limits: { max_total_channels: 8, max_whatsapp_channels: 4, max_telegram_channels: 4 },
    };
  }
  if (family === "professional") {
    return {
      workspace_limits: { max_workspace_users: 3, max_linked_web_accounts: 3 },
      channel_limits: { max_total_channels: 4, max_whatsapp_channels: 2, max_telegram_channels: 2 },
    };
  }
  if (family === "starter") {
    return {
      workspace_limits: { max_workspace_users: 1, max_linked_web_accounts: 1 },
      channel_limits: { max_total_channels: 2, max_whatsapp_channels: 1, max_telegram_channels: 1 },
    };
  }
  return null;
}

function workspaceLimitsLookFree(data: any): boolean {
  if (!isPlainObject(data)) return false;
  const ent = data.entitlements || {};
  const plan = ent.plan || {};
  const code = cleanText(ent.plan_code || plan.code).toLowerCase();
  const family = cleanText(ent.plan_family || plan.plan_family || plan.tier).toLowerCase();
  const name = cleanText(plan.name).toLowerCase();
  return !code || code === "free" || family === "free" || name === "free";
}

function cacheActiveBilling(billing: any) {
  if (!isActivePaidBilling(billing)) return;
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(BILLING_CACHE_KEY, JSON.stringify({ billing, saved_at: Date.now() }));
  } catch {
    // ignore cache failures
  }
}

function cachedActiveBilling(): any | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(BILLING_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const savedAt = Number(parsed?.saved_at || 0);
    if (!savedAt || Date.now() - savedAt > 10 * 60 * 1000) return null;
    return isActivePaidBilling(parsed?.billing) ? parsed.billing : null;
  } catch {
    return null;
  }
}

function mergeBillingIntoWorkspaceLimits(data: any, billing: any) {
  if (!isPlainObject(data) || !isActivePaidBilling(billing)) return data;

  const family = planFamilyFromBilling(billing);
  const limits = limitBundleForFamily(family);
  if (!limits) return data;

  const planCode = planCodeFromBilling(billing);
  const planName = planNameFromBilling(billing, family);
  const existingEntitlements = isPlainObject(data.entitlements) ? data.entitlements : {};
  const existingPlan = isPlainObject(existingEntitlements.plan) ? existingEntitlements.plan : {};

  return {
    ...data,
    entitlements: {
      ...existingEntitlements,
      ok: true,
      plan_code: planCode,
      plan_family: family,
      workspace_limits: limits.workspace_limits,
      channel_limits: limits.channel_limits,
      plan: {
        ...existingPlan,
        ...limits.workspace_limits,
        ...limits.channel_limits,
        code: planCode,
        name: planName,
        plan_family: family,
        tier: family,
        active: true,
      },
      subscription: billing.subscription || existingEntitlements.subscription || null,
      access_mode: "billing_frontend_fallback",
    },
  };
}

async function fetchBillingForWorkspaceFallback(headers: Record<string, string>, signal?: AbortSignal | null) {
  try {
    const res = await fetch(buildUrl("billing/me"), {
      method: "GET",
      headers,
      credentials: "include",
      signal: signal || undefined,
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (res.ok && isActivePaidBilling(data)) {
      cacheActiveBilling(data);
      return data;
    }
  } catch {
    // ignore fallback fetch failures
  }
  return cachedActiveBilling();
}

async function patchWorkspaceLimitsResponse(path: string, data: any, headers: Record<string, string>, signal?: AbortSignal | null) {
  if (normalizedApiPath(path) !== "workspace/limits") return data;
  if (!workspaceLimitsLookFree(data)) return data;

  const billing = await fetchBillingForWorkspaceFallback(headers, signal);
  return mergeBillingIntoWorkspaceLimits(data, billing);
}

function patchChannelLinkGenerateResponse(path: string, query: ApiInit["query"] | undefined, data: any) {
  if (!isPlainObject(data)) return data;

  const normalizedPath = normalizedApiPath(path);
  if (normalizedPath !== "link/generate") return data;
  if (!data.ok || !data.code) return data;

  const existingLaunchUrl =
    String(data.deep_link || data.link_url || data.bot_url || data.whatsapp_url || data.telegram_url || "").trim();
  if (existingLaunchUrl) return data;

  const provider = String(data.provider || query?.provider || "").trim().toLowerCase();
  const code = encodeURIComponent(String(data.code || "").trim().toUpperCase());
  if (!code) return data;

  if (["wa", "whatsapp", "waba"].includes(provider)) {
    const whatsappUrl = `https://wa.me/2347034941158?text=${code}`;
    return {
      ...data,
      deep_link: whatsappUrl,
      link_url: whatsappUrl,
      whatsapp_url: whatsappUrl,
    };
  }

  if (["tg", "telegram"].includes(provider)) {
    const telegramUrl = `https://t.me/naija_tax_guide_bot?start=${code}`;
    return {
      ...data,
      deep_link: telegramUrl,
      link_url: telegramUrl,
      telegram_url: telegramUrl,
      bot_url: telegramUrl,
    };
  }

  return data;
}

export async function apiJson<T = any>(
  path: string,
  init: ApiInit = {},
  token?: string | null
): Promise<T> {
  const method = (init.method || "GET").toUpperCase();

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init.headers as Record<string, string>),
  };

  const shouldUseToken = init.useAuthToken !== false;
  let effectiveToken = shouldUseToken
    ? ((token || "").trim() || safeGetLocalToken())
    : null;

  if (effectiveToken) {
    headers.Authorization = `Bearer ${effectiveToken}`;
  }

  let bodyToSend: BodyInit | undefined;

  if (init.body !== undefined) {
    const b = init.body;
    const isFormData = typeof FormData !== "undefined" && b instanceof FormData;
    const isURLParams =
      typeof URLSearchParams !== "undefined" && b instanceof URLSearchParams;
    const isBlob = typeof Blob !== "undefined" && b instanceof Blob;
    const isArrayBuffer =
      typeof ArrayBuffer !== "undefined" && b instanceof ArrayBuffer;

    if (typeof b === "string") {
      bodyToSend = b;
      if (!headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
      }
    } else if (isFormData || isURLParams || isBlob) {
      bodyToSend = b as BodyInit;
    } else if (isArrayBuffer) {
      bodyToSend = b as BodyInit;
      if (!headers["Content-Type"]) {
        headers["Content-Type"] = "application/octet-stream";
      }
    } else if (isPlainObject(b) || Array.isArray(b)) {
      bodyToSend = JSON.stringify(b);
      headers["Content-Type"] = "application/json";
    } else {
      try {
        bodyToSend = JSON.stringify(b);
        headers["Content-Type"] = "application/json";
      } catch {
        throw new ApiError(0, "Unsupported request body type", {
          ok: false,
          error: "unsupported_body_type",
        });
      }
    }
  }

  let controller: AbortController | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  if (init.timeoutMs && init.timeoutMs > 0) {
    controller = new AbortController();
    timeoutId = setTimeout(() => controller?.abort(), init.timeoutMs);
  }

  const url = buildUrl(path, init.query);

  try {
    const fetchOptions: RequestInit = {
      method,
      headers,
      body: bodyToSend,
      signal: controller?.signal ?? init.signal,
      credentials: "include",
    };
    
    const res = await fetch(url, fetchOptions);

    const text = await res.text();

    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text || null;
    }

    if (!res.ok) {
      const message =
        (data && (data.message || data.error || data.detail)) ||
        `Request failed (${res.status})`;

      const enriched = isPlainObject(data) ? { ...data, url, status: res.status } : { data, url, status: res.status };

      throw new ApiError(res.status, message, enriched);
    }

    if (["billing/me", "billing/subscription", "me", "subscription"].includes(normalizedApiPath(path))) {
      cacheActiveBilling(data);
    }

    data = await patchWorkspaceLimitsResponse(path, data, headers, controller?.signal ?? init.signal ?? null);
    data = patchChannelLinkGenerateResponse(path, init.query, data);
    return data as T;
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new ApiError(0, "Request timeout", {
        ok: false,
        error: "timeout",
        url,
      });
    }
    
    if (e instanceof ApiError) {
      throw e;
    }
    
    throw new ApiError(0, e?.message || "Network request failed", {
      ok: false,
      error: "network_error",
      originalError: e?.message,
      url,
    });
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
