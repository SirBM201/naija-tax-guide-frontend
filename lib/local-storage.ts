import { safeJsonParse } from "@/lib/safe-json";

export function storageGet(key: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function storageSet(key: string, value: string) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function storageRemove(key: string) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function storageGetJson<T>(key: string, fallback: T): T {
  return safeJsonParse<T>(storageGet(key), fallback);
}

export function storageSetJson<T>(key: string, value: T) {
  storageSet(key, JSON.stringify(value));
}

export function storageGetBool(key: string, fallback = false): boolean {
  const raw = storageGet(key);
  if (raw === null) return fallback;
  return raw === "1";
}

export function storageSetBool(key: string, value: boolean) {
  storageSet(key, value ? "1" : "0");
}