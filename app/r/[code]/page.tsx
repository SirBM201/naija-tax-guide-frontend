"use client";

import React, { useEffect, useMemo } from "react";

type PlatformKey = "website" | "whatsapp" | "telegram";

type PageProps = {
  params: {
    code: string;
  };
};

function cleanBase(value: string | undefined, fallback = "") {
  return (value || fallback || "").replace(/\/+$/, "");
}

function normalizeRefCode(value: string | undefined) {
  return (value || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 80);
}

function encode(value: string) {
  return encodeURIComponent(value);
}

export default function ReferralHubPage({ params }: PageProps) {
  const refCode = normalizeRefCode(params?.code);

  const siteBase = cleanBase(
    process.env.NEXT_PUBLIC_SITE_URL,
    "https://naijataxguides.com"
  );

  const apiBase = cleanBase(
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_URL,
    ""
  );

  const whatsappNumber = (process.env.NEXT_PUBLIC_WHATSAPP_BOT_PHONE_NUMBER || "2347034941158").replace(/\D/g, "");
  const telegramBot = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "naija_tax_guide_bot").replace(/^@/, "");

  const links = useMemo(() => {
    const website = `${siteBase}/signup?ref=${encode(refCode)}`;
    const whatsapp = `https://wa.me/${whatsappNumber}?text=${encode(`START REF ${refCode}`)}`;
    const telegram = `https://t.me/${telegramBot}?start=ref_${encode(refCode)}`;

    const tracked = (platform: PlatformKey, fallback: string) => {
      if (!apiBase) return fallback;
      return `${apiBase}/api/referral/track-and-go/${encode(refCode)}/${platform}`;
    };

    return {
      website,
      whatsapp,
      telegram,
      trackWebsite: tracked("website", website),
      trackWhatsapp: tracked("whatsapp", whatsapp),
      trackTelegram: tracked("telegram", telegram),
    };
  }, [apiBase, refCode, siteBase, telegramBot, whatsappNumber]);

  useEffect(() => {
    if (!apiBase || !refCode) return;
    const controller = new AbortController();
    const landingUrl = typeof window !== "undefined" ? window.location.href : "";
    fetch(`${apiBase}/api/referral/hub/${encode(refCode)}?landing_url=${encode(landingUrl)}`, {
      method: "GET",
      signal: controller.signal,
    }).catch(() => {
      // Tracking must never block the public referral page.
    });
    return () => controller.abort();
  }, [apiBase, refCode]);

  if (!refCode) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950">
        <section className="mx-auto max-w-2xl rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-black">Invalid referral link</h1>
          <p className="mt-3 text-slate-600">The referral code is missing or invalid.</p>
          <a
            href={siteBase}
            className="mt-6 inline-flex rounded-2xl bg-indigo-600 px-5 py-3 font-bold text-white"
          >
            Go to Naija Tax Guide
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50 px-4 py-8 text-slate-950">
      <section className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
        <div className="bg-indigo-700 px-6 py-8 text-white sm:px-10">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-indigo-100">Naija Tax Guide</p>
          <h1 className="mt-3 text-3xl font-black sm:text-5xl">Choose how to continue</h1>
          <p className="mt-4 max-w-2xl text-base text-indigo-50 sm:text-lg">
            You were invited through referral code <strong>{refCode}</strong>. Continue on Website,
            WhatsApp, or Telegram.
          </p>
        </div>

        <div className="grid gap-4 p-5 sm:p-8 md:grid-cols-3">
          <a
            href={links.trackWebsite}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-4xl">🌐</div>
            <h2 className="mt-4 text-xl font-black">Website</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Create your account, ask tax questions, manage plans, referrals, and workspace access.
            </p>
            <span className="mt-5 inline-flex rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-black text-white">
              Continue on Website
            </span>
          </a>

          <a
            href={links.trackWhatsapp}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-4xl">💬</div>
            <h2 className="mt-4 text-xl font-black">WhatsApp</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Start the WhatsApp bot with the referral code already attached.
            </p>
            <span className="mt-5 inline-flex rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white">
              Continue on WhatsApp
            </span>
          </a>

          <a
            href={links.trackTelegram}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-4xl">✈️</div>
            <h2 className="mt-4 text-xl font-black">Telegram</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Start the Telegram bot with the referral code already attached.
            </p>
            <span className="mt-5 inline-flex rounded-2xl bg-sky-600 px-4 py-3 text-sm font-black text-white">
              Continue on Telegram
            </span>
          </a>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 p-5 sm:p-8">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <h3 className="text-lg font-black">Referral code</h3>
            <p className="mt-2 break-all rounded-2xl bg-slate-100 px-4 py-3 font-mono text-lg font-bold text-slate-900">
              {refCode}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Referral rewards apply according to the active Naija Tax Guide referral policy after a
              successful paid subscription.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
