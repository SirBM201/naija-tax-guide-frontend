import { apiJson } from "@/lib/api";

export type GuestSessionBootstrap = {
  ok: boolean;
  guest_session?: {
    guest_session_id?: string;
    entry_channel?: string;
    referral_code?: string | null;
    referrer_account_id?: string | null;
    referral_locked?: boolean;
    first_seen_at?: string;
    last_seen_at?: string;
  };
  visitor_token_present?: boolean;
};

let bootPromise: Promise<GuestSessionBootstrap> | null = null;

export function bootstrapGuestEntry(): Promise<GuestSessionBootstrap> {
  if (!bootPromise) {
    bootPromise = apiJson<GuestSessionBootstrap>("/entry/bootstrap", {
      method: "GET",
    }).catch((error) => {
      bootPromise = null;
      throw error;
    });
  }
  return bootPromise;
}

export async function linkGuestSessionToAccount(): Promise<void> {
  await apiJson("/entry/link-account", {
    method: "POST",
  });
}