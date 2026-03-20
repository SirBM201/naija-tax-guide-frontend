// lib/backend.ts
export const BACKEND_URL =
  (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").trim() || "http://localhost:5000";

type JsonRecord = Record<string, any>;

async function requestJson<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${BACKEND_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data: JsonRecord = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}

export async function backendGet<T>(path: string): Promise<T> {
  return requestJson<T>("GET", path);
}

export async function backendPost<T>(path: string, body: unknown): Promise<T> {
  return requestJson<T>("POST", path, body);
}
