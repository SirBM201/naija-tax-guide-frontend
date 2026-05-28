import type { Metadata } from "next";

type PageProps = {
  params: Promise<{
    code: string;
  }>;
};

function cleanCode(value: string): string {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .toUpperCase();
}

function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_WEB_BASE_URL ||
    "https://naijataxguides.com";

  return raw.replace(/\/+$/, "");
}

function getWhatsAppNumber(): string {
  return String(process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "").replace(
    /[^0-9]/g,
    ""
  );
}

function getTelegramBotUsername(): string {
  return String(process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "")
    .replace(/^@/, "")
    .trim();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const code = cleanCode(resolvedParams.code);

  return {
    title: code
      ? `Join Naija Tax Guide with ${code}`
      : "Join Naija Tax Guide",
    description:
      "Choose Website, WhatsApp, or Telegram to join Naija Tax Guide with a referral code.",
  };
}

export default async function ReferralHubPage({ params }: PageProps) {
  const resolvedParams = await params;
  const code = cleanCode(resolvedParams.code);

  const siteUrl = getSiteUrl();
  const whatsappNumber = getWhatsAppNumber();
  const telegramBotUsername = getTelegramBotUsername();

  const signupUrl = `${siteUrl}/signup?ref=${encodeURIComponent(code)}`;

  const whatsappText = `START REF_${code}`;
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        whatsappText
      )}`
    : "";

  const telegramUrl = telegramBotUsername
    ? `https://t.me/${telegramBotUsername}?start=${encodeURIComponent(
        `ref_${code}`
      )}`
    : "";

  const inviteText = `Join Naija Tax Guide using my referral code ${code}. You can continue on Website, WhatsApp, or Telegram here: ${siteUrl}/ref/${encodeURIComponent(
    code
  )}`;

  if (!code) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950">
        <section className="mx-auto max-w-2xl rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-red-600">
            Invalid referral link
          </p>
          <h1 className="mt-3 text-3xl font-black">Referral code missing</h1>
          <p className="mt-3 text-slate-600">
            Please confirm the referral link and try again.
          </p>
          <a
            href={siteUrl}
            className="mt-6 inline-flex rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-black text-white shadow-sm"
          >
            Go to Naija Tax Guide
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eef6ff,transparent_28%),linear-gradient(180deg,#f8fafc,#eef2ff)] px-4 py-8 text-slate-950">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-xl backdrop-blur md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex rounded-full bg-indigo-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-indigo-700">
                Naija Tax Guide Referral
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight md:text-5xl">
                Join Naija Tax Guide
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                You were invited with referral code{" "}
                <span className="font-black text-slate-950">{code}</span>.
                Choose how you want to continue.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-center">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                Referral code
              </p>
              <p className="mt-2 text-3xl font-black tracking-wider text-indigo-700">
                {code}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <a
              href={signupUrl}
              className="group rounded-3xl border border-indigo-100 bg-indigo-600 p-6 text-white shadow-lg shadow-indigo-100 transition hover:-translate-y-1 hover:bg-indigo-700"
            >
              <p className="text-3xl">🌐</p>
              <h2 className="mt-4 text-xl font-black">Continue on Website</h2>
              <p className="mt-2 text-sm leading-6 text-indigo-50">
                Create or access your web account with this referral code.
              </p>
              <p className="mt-5 text-sm font-black">Open website →</p>
            </a>

            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                className="group rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
              >
                <p className="text-3xl">🟢</p>
                <h2 className="mt-4 text-xl font-black">Continue on WhatsApp</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Open WhatsApp with the referral message already prepared.
                </p>
                <p className="mt-5 text-sm font-black text-emerald-700">
                  Open WhatsApp →
                </p>
              </a>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-slate-100 p-6 text-slate-500">
                <p className="text-3xl">🟢</p>
                <h2 className="mt-4 text-xl font-black">WhatsApp</h2>
                <p className="mt-2 text-sm leading-6">
                  WhatsApp link is not configured yet.
                </p>
              </div>
            )}

            {telegramUrl ? (
              <a
                href={telegramUrl}
                className="group rounded-3xl border border-sky-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-lg"
              >
                <p className="text-3xl">🔵</p>
                <h2 className="mt-4 text-xl font-black">Continue on Telegram</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Start the Telegram bot with this referral code attached.
                </p>
                <p className="mt-5 text-sm font-black text-sky-700">
                  Open Telegram →
                </p>
              </a>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-slate-100 p-6 text-slate-500">
                <p className="text-3xl">🔵</p>
                <h2 className="mt-4 text-xl font-black">Telegram</h2>
                <p className="mt-2 text-sm leading-6">
                  Telegram bot username is not configured yet.
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-black text-slate-700">
              Ready-to-share invitation message
            </p>
            <p className="mt-3 break-words rounded-2xl bg-white p-4 text-sm leading-6 text-slate-700">
              {inviteText}
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <a
              href={signupUrl}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center text-sm font-black text-slate-900 shadow-sm transition hover:bg-slate-50"
            >
              Website signup link
            </a>

            <a
              href={`${siteUrl}`}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center text-sm font-black text-slate-900 shadow-sm transition hover:bg-slate-50"
            >
              Visit Naija Tax Guide homepage
            </a>
          </div>

          <p className="mt-8 text-center text-xs leading-6 text-slate-500">
            Referral rewards apply according to the active referral policy after
            a successful paid subscription.
          </p>
        </div>
      </section>
    </main>
  );
}
