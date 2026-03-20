// lib/http.ts
import { CONFIG } from "@/lib/config";

export async function apiGet<T>(path: string, token?: string | null): Promise<T> {
  const res = await fetch(`${CONFIG.apiBase}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const data = isJson ? await res.json() : ({} as any);

  if (!res.ok) {
    const msg = data?.error || data?.message || `${res.status} ${res.statusText}` || "request_failed";
    throw new Error(msg);
  }

  return data as T;
}

export async function apiPost<T>(path: string, body: any, token?: string | null): Promise<T> {
  const res = await fetch(`${CONFIG.apiBase}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const data = isJson ? await res.json() : ({} as any);

  if (!res.ok) {
    const msg = data?.error || data?.message || `${res.status} ${res.statusText}` || "request_failed";
    throw new Error(msg);
  }

  return data as T;
}
