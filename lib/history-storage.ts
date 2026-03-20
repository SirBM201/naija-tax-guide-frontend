export type HistorySource = "web" | "whatsapp" | "telegram";

export type HistoryItem = {
  id: string;
  question: string;
  answer: string;
  language: string;
  created_at: string;
  source: HistorySource | string;
};

const HISTORY_STORAGE_KEY = "ntg-history-items";

function isBrowser() {
  return typeof window !== "undefined";
}

function safeParse(value: string | null): HistoryItem[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getHistoryItems(): HistoryItem[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
  const items = safeParse(raw);

  return items
    .filter((item) => item && typeof item === "object")
    .sort((a, b) => {
      const aTime = new Date(String(a?.created_at || "")).getTime();
      const bTime = new Date(String(b?.created_at || "")).getTime();
      return bTime - aTime;
    });
}

export function saveHistoryItems(items: HistoryItem[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items));
}

export function saveHistoryItem(item: HistoryItem) {
  const existing = getHistoryItems();
  const next = [item, ...existing.filter((x) => x.id !== item.id)];
  saveHistoryItems(next);
}

export function deleteHistoryItem(id: string) {
  const existing = getHistoryItems();
  const next = existing.filter((item) => item.id !== id);
  saveHistoryItems(next);
}

export function clearHistoryItems() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(HISTORY_STORAGE_KEY);
}