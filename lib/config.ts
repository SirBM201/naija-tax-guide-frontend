// lib/config.ts

function clean(value: string | undefined | null): string {
  return String(value || "").trim().replace(/\/$/, "");
}

const explicitApiBase =
  clean(process.env.NEXT_PUBLIC_API_BASE_URL) ||
  clean(process.env.NEXT_PUBLIC_API_BASE);

const localFallbackApiBase = "http://localhost:5000/api";

export const CONFIG = {
  siteUrl: clean(process.env.NEXT_PUBLIC_SITE_URL) || "http://localhost:3000",
  domain: clean(process.env.NEXT_PUBLIC_DOMAIN) || "localhost",
  apiBase: explicitApiBase || localFallbackApiBase,
};

if (!explicitApiBase && typeof window !== "undefined") {
  console.warn(
    `[CONFIG] NEXT_PUBLIC_API_BASE_URL / NEXT_PUBLIC_API_BASE not set. Falling back to ${localFallbackApiBase}`
  );
}