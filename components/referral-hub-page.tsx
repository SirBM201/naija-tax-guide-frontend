// components/referral-hub-page.tsx
import React from "react";

const ROUTE_VERSION = "2026-05-28-v32c-frontend-referral-smart-hub";

type ReferralLinks = {
  code?: string;
  smart?: string;
  smart_ref?: string;
  smart_r?: string;
  website?: string;
  web?: string;
  whatsapp?: string;
  telegram?: string;
  track_website?: string;
  track_web?: string;
  track_whatsapp?: string;
  track_telegram?: string;
};

type ReferralHubResponse = {
  ok?: boolean;
  route_version?: string;
  referral_code?: string;
  links?: ReferralLinks;
  error?: string;
};

function clean(value: unknown, fallback = ""): string {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeCode(value: unknown): string {
  return clean(value)
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, "")
    .slice(0, 80);
}

function publicSiteUrl(): string {
  return clean(
    process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.FRONTEND_BASE_URL ||
      process.env.PUBLIC_SITE_URL,
    "https://www.naijataxguides.com"
  ).replace(/\/$/, "");
}

function apiBaseUrl(): string {
  return clean(
    process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.API_BASE_URL ||
      process.env.BACKEND_BASE_URL ||
      process.env.KOYEB_PUBLIC_URL,
    "https://incredible-nonie-bmsconcept-37359733.koyeb.app"
  ).replace(/\/$/, "");
}

function fallbackLinks(code: string): ReferralLinks {
  const site = publicSiteUrl();
  const api = apiBaseUrl();
  const encodedPath = encodeURIComponent(code);
  const encodedQuery = encodeURIComponent(code);
  const whatsappText = encodeURIComponent(`START REF ${code}`);

  return {
    code,
    smart: `${site}/ref/${encodedPath}`,
    smart_ref: `${site}/ref/${encodedPath}`,
    smart_r: `${site}/r/${encodedPath}`,
    website: `${site}/signup?ref=${encodedQuery}`,
    web: `${site}/signup?ref=${encodedQuery}`,
    whatsapp: `https://wa.me/2347034941158?text=${whatsappText}`,
    telegram: `https://t.me/naija_tax_guide_bot?start=ref_${encodedQuery}`,
    track_website: `${api}/api/referral/track-and-go/${encodedPath}/website`,
    track_web: `${api}/api/referral/track-and-go/${encodedPath}/website`,
    track_whatsapp: `${api}/api/referral/track-and-go/${encodedPath}/whatsapp`,
    track_telegram: `${api}/api/referral/track-and-go/${encodedPath}/telegram`,
  };
}

async function loadReferralHub(refCode: string): Promise<ReferralHubResponse> {
  const code = normalizeCode(refCode);
  const api = apiBaseUrl();

  try {
    const res = await fetch(`${api}/api/referral/hub/${encodeURIComponent(code)}?source=frontend_hub`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    const data = (await res.json().catch(() => null)) as ReferralHubResponse | null;
    if (res.ok && data?.ok && data.links) {
      return data;
    }

    return {
      ok: false,
      route_version: ROUTE_VERSION,
      referral_code: code,
      links: fallbackLinks(code),
      error: data?.error || `Backend returned HTTP ${res.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      route_version: ROUTE_VERSION,
      referral_code: code,
      links: fallbackLinks(code),
      error: error instanceof Error ? error.message : "Could not load referral hub.",
    };
  }
}

function ButtonLink({
  href,
  label,
  helper,
  primary = false,
}: {
  href: string;
  label: string;
  helper: string;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      style={{
        display: "block",
        borderRadius: 18,
        border: primary ? "1px solid #4f46e5" : "1px solid #e5e7eb",
        background: primary ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : "#ffffff",
        color: primary ? "#ffffff" : "#111827",
        padding: "16px 18px",
        textDecoration: "none",
        boxShadow: primary ? "0 18px 35px rgba(79, 70, 229, 0.25)" : "0 12px 28px rgba(15, 23, 42, 0.08)",
      }}
    >
      <div style={{ fontSize: 17, fontWeight: 900 }}>{label}</div>
      <div
        style={{
          marginTop: 6,
          color: primary ? "rgba(255,255,255,0.86)" : "#64748b",
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        {helper}
      </div>
    </a>
  );
}

export default async function ReferralHubPage({ refCode }: { refCode: string }) {
  const code = normalizeCode(refCode);
  const data = await loadReferralHub(code);
  const links = data.links || fallbackLinks(code);

  const website = clean(links.track_website || links.track_web || links.website || links.web);
  const whatsapp = clean(links.track_whatsapp || links.whatsapp || website);
  const telegram = clean(links.track_telegram || links.telegram || website);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(79, 70, 229, 0.12), transparent 32%), linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
        padding: "32px 16px",
        color: "#0f172a",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 920,
          margin: "0 auto",
          display: "grid",
          gap: 18,
        }}
      >
        <div
          style={{
            borderRadius: 28,
            background: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(226,232,240,0.95)",
            boxShadow: "0 24px 70px rgba(15, 23, 42, 0.10)",
            padding: "28px clamp(20px, 5vw, 42px)",
            display: "grid",
            gap: 18,
          }}
        >
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#4f46e5", letterSpacing: 0.4 }}>
              Naija Tax Guide Referral Hub
            </div>
            <h1 style={{ margin: 0, fontSize: "clamp(30px, 6vw, 54px)", lineHeight: 1.04, letterSpacing: -1.5 }}>
              Choose how you want to continue
            </h1>
            <p style={{ margin: 0, color: "#475569", fontSize: 17, lineHeight: 1.65, maxWidth: 720 }}>
              You were invited to Naija Tax Guide. Use any option below and your referral code will remain attached.
            </p>
          </div>

          <div
            style={{
              borderRadius: 20,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              padding: 18,
              display: "grid",
              gap: 6,
            }}
          >
            <div style={{ color: "#64748b", fontSize: 13, fontWeight: 800, textTransform: "uppercase" }}>
              Referral Code
            </div>
            <div style={{ fontSize: "clamp(26px, 6vw, 42px)", fontWeight: 950, letterSpacing: 1 }}>
              {code || "—"}
            </div>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <ButtonLink
              href={website}
              label="Continue on Website"
              helper="Create your account or sign in through the secure web platform."
              primary
            />
            <ButtonLink
              href={whatsapp}
              label="Continue on WhatsApp"
              helper="Open the Naija Tax Guide WhatsApp bot with this referral code."
            />
            <ButtonLink
              href={telegram}
              label="Continue on Telegram"
              helper="Open the Naija Tax Guide Telegram bot with this referral code."
            />
          </div>

          <div
            style={{
              borderRadius: 18,
              background: data.ok ? "#ecfdf5" : "#fff7ed",
              border: data.ok ? "1px solid #bbf7d0" : "1px solid #fed7aa",
              padding: 16,
              color: data.ok ? "#166534" : "#9a3412",
              fontSize: 14,
              lineHeight: 1.55,
            }}
          >
            {data.ok
              ? "Referral tracking is active. Platform selections from this hub are recorded before redirect."
              : "The hub page loaded with safe fallback links. Backend tracking can be checked after deployment."}
          </div>
        </div>

        <div style={{ textAlign: "center", color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
          BMS SparkVision Hub • Igniting Ideas. Building the Future.
          <br />
          Page version: {ROUTE_VERSION}
        </div>
      </section>
    </main>
  );
}
