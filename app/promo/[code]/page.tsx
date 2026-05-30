"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppShell, { shellButtonPrimary, shellButtonSecondary } from "@/components/app-shell";
import { Banner, Card } from "@/components/ui";
import { CardsGrid, SectionStack } from "@/components/page-layout";

type PromoLinks = {
  code?: string;
  promo_hub?: string;
  smart?: string;
  short?: string;
  signup?: string;
  website?: string;
  whatsapp?: string;
  telegram?: string;
  track_website?: string;
  track_whatsapp?: string;
  track_telegram?: string;
};

type PromoValidation = {
  valid?: boolean;
  reason?: string;
  promo?: {
    code?: string;
    name?: string;
    description?: string;
    benefit_type?: string;
    discount_percent?: number | string;
    discount_amount_ngn?: number | string;
    bonus_credits?: number | string;
    owner_name?: string;
  };
};

type PromoHubResponse = {
  ok?: boolean;
  promo_code?: string;
  valid?: boolean;
  validation?: PromoValidation;
  links?: PromoLinks;
};

function apiBase(): string {
  const env = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
  return env.replace(/\/$/, "") || "https://incredible-nonie-bmsconcept-37359733.koyeb.app";
}

function cleanCode(value: unknown): string {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "");
}

function benefitText(validation?: PromoValidation): string {
  const promo = validation?.promo || {};
  const benefit = String(promo.benefit_type || "").toLowerCase();
  const percent = Number(promo.discount_percent || 0);
  const fixed = Number(promo.discount_amount_ngn || 0);
  const bonus = Number(promo.bonus_credits || 0);
  if (benefit.includes("percent") && percent > 0) return `${percent}% off your first paid subscription.`;
  if (benefit.includes("amount") && fixed > 0) return `₦${fixed.toLocaleString()} off your first paid subscription.`;
  if (benefit.includes("credit") && bonus > 0) return `${bonus} bonus AI credits after signup/payment qualification.`;
  if (percent > 0) return `${percent}% off your first paid subscription.`;
  if (fixed > 0) return `₦${fixed.toLocaleString()} off your first paid subscription.`;
  if (bonus > 0) return `${bonus} bonus AI credits.`;
  return "A promotional signup benefit may apply according to the active promo policy.";
}

function PromoHubContent() {
  const params = useParams();
  const code = cleanCode(params?.code);
  const [data, setData] = useState<PromoHubResponse | null>(null);
  const [error, setError] = useState("");

  const apiUrl = useMemo(() => {
    if (!code) return "";
    return `${apiBase()}/api/promo/hub/${encodeURIComponent(code)}?source=frontend_promo_hub`;
  }, [code]);

  useEffect(() => {
    let alive = true;
    async function run() {
      if (!apiUrl) return;
      setError("");
      try {
        const res = await fetch(apiUrl, { cache: "no-store" });
        const json = (await res.json()) as PromoHubResponse;
        if (!alive) return;
        setData(json);
      } catch {
        if (!alive) return;
        setError("Promo details could not be loaded right now. You can still continue to signup with the code.");
      }
    }
    void run();
    return () => {
      alive = false;
    };
  }, [apiUrl]);

  const links = data?.links || {};
  const valid = data?.valid;
  const signupHref = links.track_website || links.signup || `/signup?promo=${encodeURIComponent(code)}`;
  const whatsappHref = links.track_whatsapp || links.whatsapp || "#";
  const telegramHref = links.track_telegram || links.telegram || "#";

  return (
    <AppShell
      title="Promo Code"
      subtitle="Use this promo code during signup. Promo codes are captured before payment to avoid double rewards or revenue confusion."
    >
      <SectionStack>
        {error ? <Banner title="Promo lookup warning" subtitle={error} tone="warn" /> : null}

        <Banner
          title={valid === false ? "Promo code could not be validated" : "Promo code detected"}
          subtitle={valid === false ? `Code ${code} may be inactive, expired, or not yet configured.` : `Code ${code} is ready for signup.`}
          tone={valid === false ? "warn" : "good"}
        />

        <Card>
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Promo Code</div>
              <div style={{ fontSize: "clamp(30px, 7vw, 48px)", fontWeight: 950, color: "var(--text)", wordBreak: "break-word" }}>
                {code}
              </div>
            </div>

            <div style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>
              {benefitText(data?.validation)}
            </div>

            <div style={{ color: "var(--text-faint)", fontSize: 13, lineHeight: 1.7 }}>
              Rule: this promo code is attached during signup. It should not be entered again at payment.
            </div>
          </div>
        </Card>

        <CardsGrid min={220}>
          <a href={signupHref} style={{ ...shellButtonPrimary(), textDecoration: "none", textAlign: "center" }}>
            Continue to Website Signup
          </a>
          <a href={whatsappHref} style={{ ...shellButtonSecondary(), textDecoration: "none", textAlign: "center" }}>
            Continue on WhatsApp
          </a>
          <a href={telegramHref} style={{ ...shellButtonSecondary(), textDecoration: "none", textAlign: "center" }}>
            Continue on Telegram
          </a>
        </CardsGrid>

        <Card>
          <div style={{ display: "grid", gap: 10, color: "var(--text-muted)", lineHeight: 1.7 }}>
            <strong style={{ color: "var(--text)" }}>Important</strong>
            <div>
              One signup can use either a referral code or a promo code, not both. This protects users, influencers, and the platform from double rewards or conflicting attribution.
            </div>
            <Link href="/plans" style={{ color: "var(--accent)", fontWeight: 800 }}>
              View available plans
            </Link>
          </div>
        </Card>
      </SectionStack>
    </AppShell>
  );
}

function Fallback() {
  return (
    <AppShell title="Promo Code" subtitle="Loading promo page...">
      <SectionStack>
        <Banner title="Loading" subtitle="Preparing promo details." tone="default" />
      </SectionStack>
    </AppShell>
  );
}

export default function PromoCodePage() {
  return (
    <Suspense fallback={<Fallback />}>
      <PromoHubContent />
    </Suspense>
  );
}
