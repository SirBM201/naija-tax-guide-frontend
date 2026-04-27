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
        console.log(`✅ Found token in localStorage key: ${key}`);
        return value.trim();
      }
    }
    
    for (const key of tokenKeys) {
      const value = sessionStorage.getItem(key);
      if (value && value.trim() && value !== "undefined" && value !== "null") {
        console.log(`✅ Found token in sessionStorage key: ${key}`);
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
  // Use relative path - Next.js rewrites will handle proxy
  let cleanPath = path;
  if (cleanPath.startsWith("/api/")) {
    cleanPath = cleanPath.substring(4);
  } else if (cleanPath.startsWith("api/")) {
    cleanPath = cleanPath.substring(3);
  }
  
  const normalizedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  const url = `/api${normalizedPath}`;

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
    console.log(`🔐 Using Bearer token for: ${path}`);
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
    
    console.log(`🚀 ${method} ${url}`);
    
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

      console.error(`❌ API Error ${res.status}: ${url}`, enriched);

      if (res.status === 401) {
        console.error("🔑 Authentication failed!");
      }

      throw new ApiError(res.status, message, enriched);
    }

    console.log(`✅ ${method} ${url} - ${res.status}`);
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
