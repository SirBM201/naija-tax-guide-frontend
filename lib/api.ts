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

function isPlainObject(v: any) {
  if (v === null || typeof v !== "object") return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

function safeGetLocalToken(): string | null {
  try {
    if (typeof window === "undefined") return null;
    return (window.localStorage.getItem("nt_access_token") || "").trim() || null;
  } catch {
    return null;
  }
}

export function clearStoredAuthToken() {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem("nt_access_token");
    window.localStorage.removeItem("web_token");
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("auth_token");
  } catch {
    // ignore
  }
}

function normalizeApiRoot(raw: string): string {
  const v = (raw || "").trim();
  if (!v) return "";

  if (v.startsWith("/")) {
    return "/api";
  }

  try {
    const u = new URL(v);
    let path = (u.pathname || "").replace(/\/+$/, "");

    if (!path || path === "/") {
      path = "/api";
    } else if (path !== "/api") {
      path = "/api";
    }

    u.pathname = path;
    u.search = "";
    u.hash = "";
    return u.toString().replace(/\/+$/, "");
  } catch {
    return "";
  }
}

function buildUrl(path: string, query?: ApiInit["query"]) {
  const apiRoot = normalizeApiRoot(CONFIG.apiBase);

  if (!apiRoot) {
    throw new ApiError(0, "NEXT_PUBLIC_API_BASE_URL is missing or invalid.", {
      ok: false,
      error: "missing_api_base",
    });
  }

  // Remove any leading /api/ from path to avoid duplication
  let cleanPath = path;
  if (cleanPath.startsWith("/api/")) {
    cleanPath = cleanPath.substring(4);
  } else if (cleanPath.startsWith("api/")) {
    cleanPath = cleanPath.substring(3);
  }
  
  const normalizedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  const url = new URL(`${apiRoot}${normalizedPath}`);

  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === null || v === undefined) continue;
      url.searchParams.set(k, String(v));
    }
  }

  return url.toString();
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

  const shouldUseToken = Boolean(init.useAuthToken);
  const effectiveToken = shouldUseToken
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
    const res = await fetch(url, {
      mode: "cors",
      ...init,
      credentials: "include",  // CRITICAL: sends cookies for session auth
      method,
      headers,
      body: bodyToSend,
      signal: controller?.signal ?? init.signal,
    });

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

      // Enhanced error logging for debugging
      console.error(`API Error [${res.status}]: ${url}`, enriched);

      if (
        shouldUseToken &&
        res.status === 401 &&
        enriched &&
        typeof enriched === "object" &&
        (
          enriched.error === "invalid_token" ||
          enriched.error === "unauthorized" ||
          enriched?.debug?.error === "invalid_token"
        )
      ) {
        clearStoredAuthToken();
      }

      throw new ApiError(res.status, message, enriched);
    }

    return data as T;
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new ApiError(0, "Request timeout", {
        ok: false,
        error: "timeout",
        url,
      });
    }
    
    // Re-throw ApiError as-is
    if (e instanceof ApiError) {
      throw e;
    }
    
    // Wrap network errors for better exposure
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
