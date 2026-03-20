import { STORAGE_KEYS } from "@/lib/storage-keys";
import { storageGetJson, storageSetJson } from "@/lib/local-storage";

export type SupportTicket = {
  id: string;
  subject: string;
  category: string;
  priority: string;
  message: string;
  created_at: string;
  status: "draft" | "submitted";
};

export function getSupportTickets(): SupportTicket[] {
  return storageGetJson<SupportTicket[]>(STORAGE_KEYS.supportTickets, []).sort((a, b) => {
    const aTime = new Date(a.created_at || 0).getTime();
    const bTime = new Date(b.created_at || 0).getTime();
    return bTime - aTime;
  });
}

export function saveSupportTicket(ticket: SupportTicket) {
  const current = getSupportTickets();
  const next = [ticket, ...current].slice(0, 100);
  storageSetJson(STORAGE_KEYS.supportTickets, next);
}