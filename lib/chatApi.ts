import { CONFIG } from "./config";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${CONFIG.apiBase}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    return (typeof body === "object" ? body : { ok: false, error: body }) as T;
  }
  return body as T;
}

export type AskResponse = {
  ok: boolean;
  answer?: string;
  error?: string;
  reason?: string;
  state?: string;
  expires_at?: string | null;
  grace_until?: string | null;
};

export async function askWithAccount(account_id: string, question: string): Promise<AskResponse> {
  return http<AskResponse>("/api/ask", {
    method: "POST",
    body: JSON.stringify({ account_id, question }),
  });
}
