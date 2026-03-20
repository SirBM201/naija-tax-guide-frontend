// lib/supabaseBrowser.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

/**
 * IMPORTANT:
 * - Use the "anon public" key here (NEXT_PUBLIC_SUPABASE_ANON_KEY)
 * - NEVER use service_role in the browser
 */
function makeClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Fail fast in dev with a clear message
    throw new Error(
      [
        "Missing Supabase env vars.",
        "Set these in .env.local then restart `npm run dev`:",
        "  NEXT_PUBLIC_SUPABASE_URL=...",
        "  NEXT_PUBLIC_SUPABASE_ANON_KEY=... (anon public key)",
      ].join("\n")
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export const supabaseBrowser: SupabaseClient = makeClient();
