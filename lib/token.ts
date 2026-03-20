// lib/token.ts

const KEY = "web_token";

export function getWebToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

export function setWebToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, token);
}

export function clearWebToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
