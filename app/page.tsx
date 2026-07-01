"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiJson } from "@/lib/api";
import { SITE } from "@/lib/site";
import { themeChipStyle, themeVars, useSharedTheme } from "@/lib/theme";

type WebMeResp = {
  ok?: boolean;
  account_id?: string;
  error?: string;
};

const sampleQuestions = [
  "I earn salary in Lagos. What should I know about PAYE?",
  "My small business sells online. When should I think about VAT?",
  "What records should a freelancer keep for tax compliance?",
  "How do I know when a tax issue needs a human professional?",
];

const trustLinks = [
  { label: "Pricing", href: "/pricing" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Support", href: "/support" },
  { label: "Contact", href: "/contact" },
];

function primaryButton(disabled = false): React.CSSProperties {
  return {
    padding: "15px 18px",
    borderRadius: 16,
    border: "1px solid var(--accent-border)",
    background: disabled ? "#e5e7eb" : "var(--button-bg-strong)",
    color: disabled ? "#6b7280" : "var(--text)",
    fontWeight: 900,
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 15,
    width: "100%",
  };
}

function secondaryButton(disabled = false): React.CSSProperties {
  return {
    padding: "15px 18px",
    borderRadius: 16,
    border: "1px solid var(--border-strong)",
    background: disabled ? "#f3f4f6" : "var(--button-bg)",
    color: disabled ? "#6b7280" : "var(--text)",
    fontWeight: 900,
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 15,
    width: "100%",
  };
}

function cardStyle(tone: "default" | "good" | "warn" = "default"): React.CSSProperties {
  const border = tone === "good" ? "var(--success-border)" : tone === "warn" ? "var(--warn-border)" : "var(--border)";
  const bg = tone === "good" ? "var(--success-bg)" : tone === "warn" ? "var(--warn-bg)" : "var(--panel-bg)";
  return {
    borderRadius: 22,
    border: `1px solid ${border}`,
    background: bg,
    padding: 22,
    minWidth: 0,
    display: "grid",
    gap: 14,
  };
}

function pillStyle(tone: "default" | "good" | "warn" = "default"): React.CSSProperties {
  const border = tone === "good" ? "var(--success-border)" : tone === "warn" ? "var(--warn-border)" : "var(--border)";
  const bg = tone === "good" ? "var(--success-bg)" : tone === "warn" ? "var(--warn-bg)" : "var(--surface)";
  return {
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    maxWidth: "100%",
    borderRadius: 999,
    border: `1px solid ${border}`,
    background: bg,
    padding: "7px 11px",
    color: "var(--text-soft)",
    fontSize: 12,
    fontWeight: 850,
    overflowWrap: "anywhere",
  };
}

function sectionTitle(eyebrow: string, title: string, subtitle: string): React.ReactNode {
  return (
    <div style={{ display: "grid", gap: 9 }}>
      <div style={{ color: "var(--gold)", fontWeight: 850, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.6 }}>
        {eyebrow}
      </div>
      <h2 style={{ margin: 0, color: "var(--text)", fontWeight: 950, fontSize: "clamp(28px, 5vw, 36px)", lineHeight: 1.08, letterSpacing: -0.6 }}>
        {title}
      </h2>
      <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 16, lineHeight: 1.8, maxWidth: 900 }}>
        {subtitle}
      </p>
    </div>
  );
}

function bullet(item: string): React.ReactNode {
  return (
    <div key={item} style={{ display: "grid", gridTemplateColumns: "22px minmax(0, 1fr)", gap: 8, color: "var(--text-muted)", lineHeight: 1.65 }}>
      <strong style={{ color: "var(--accent)" }}>✓</strong>
      <span>{item}</span>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { themeMode, resolvedMode, setThemeMode } = useSharedTheme();
  const [hasSession, setHasSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let alive = true;

    const checkSession = async () => {
      try {
        const data = await apiJson<WebMeResp>("/web/auth/me", {
          method: "GET",
          timeoutMs: 12000,
          useAuthToken: false,
        });
        if (alive) setHasSession(Boolean(data?.ok && data?.account_id));
      } catch {
        if (alive) setHasSession(false);
      } finally {
        if (alive) setCheckingSession(false);
      }
    };

    void checkSession();
    return () => {
      alive = false;
    };
  }, []);

  const goToApp = () => router.push(hasSession ? "/dashboard" : "/login");
  const appLabel = checkingSession ? "Checking..." : hasSession ? "Continue to Dashboard" : `Start Using ${SITE.name}`;

  return (
    <main style={{ minHeight: "100vh", background: "var(--app-bg)", color: "var(--text)", ...themeVars(resolvedMode) }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "18px 14px 64px", display: "grid", gap: 30 }}>
        <header style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "56px minmax(0, 1fr)", gap: 12, alignItems: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, overflow: "hidden", border: "1px solid var(--accent-border)", background: "var(--surface-strong)" }}>
              <img src="/bms-logo.jpg" alt={`${SITE.companyName} logo`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: "var(--text)", fontWeight: 950, fontSize: "clamp(20px, 4vw, 24px)", lineHeight: 1.05 }}>{SITE.name}</div>
              <div style={{ marginTop: 6, color: "var(--gold)", fontWeight: 800, fontSize: 13 }}>{SITE.productOwnerLine}</div>
            </div>
          </div>

          <nav style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10 }}>
            {trustLinks.map((link) => (
              <button key={link.href} onClick={() => router.push(link.href)} style={secondaryButton()}>
                {link.label}
              </button>
            ))}
            <button onClick={() => setThemeMode("dark")} style={{ ...themeChipStyle(themeMode === "dark"), width: "100%" }}>Dark</button>
            <button onClick={() => setThemeMode("light")} style={{ ...themeChipStyle(themeMode === "light"), width: "100%" }}>Light</button>
            <button onClick={goToApp} disabled={checkingSession} style={primaryButton(checkingSession)}>{appLabel}</button>
          </nav>
        </header>

        <section style={cardStyle("good")}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 22, alignItems: "center" }}>
            <div style={{ display: "grid", gap: 18 }}>
              <div style={pillStyle("good")}>Nigeria-focused AI tax guidance</div>
              <h1 style={{ margin: 0, color: "var(--text)", fontSize: "clamp(36px, 8vw, 64px)", lineHeight: 1.01, letterSpacing: -1.3, fontWeight: 950 }}>
                Understand Nigerian tax questions before they become expensive mistakes.
              </h1>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "clamp(16px, 2.7vw, 19px)", lineHeight: 1.85, maxWidth: 860 }}>
                {SITE.name} helps individuals, freelancers, creators, and SMEs ask practical Nigerian tax questions, use basic calculators, track usage, and access guidance across web, WhatsApp, and Telegram.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
                <button onClick={goToApp} disabled={checkingSession} style={primaryButton(checkingSession)}>{appLabel}</button>
                <button onClick={() => router.push("/pricing")} style={secondaryButton()}>View Public Pricing</button>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span style={pillStyle()}>Web workspace</span>
                <span style={pillStyle()}>WhatsApp: {SITE.whatsappDisplay}</span>
                <span style={pillStyle()}>Telegram: @{SITE.telegramBot}</span>
              </div>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              <div style={cardStyle()}>
                <div style={pillStyle("warn")}>Important guidance boundary</div>
                <p style={{ margin: 0, color: "var(--text)", lineHeight: 1.8 }}>
                  {SITE.name} provides general Nigerian tax information and guided support. It is not a government portal, law firm, accounting firm, or substitute for a qualified professional in audits, disputes, penalties, or formal filing decisions.
                </p>
              </div>
              <div style={cardStyle()}>
                <div style={pillStyle()}>Trust pages visible before signup</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
                  {trustLinks.map((link) => (
                    <button key={link.href} onClick={() => router.push(link.href)} style={secondaryButton()}>{link.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ display: "grid", gap: 18 }}>
          {sectionTitle(
            "What the product does",
            "Practical tax support without confusing jargon.",
            "The product is designed to deliver value quickly: clearer explanations, basic calculators, usage control, and escalation boundaries where a tax matter needs professional review."
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>
            <div style={cardStyle()}>{["Ask plain-language Nigerian tax questions", "Get structured answers and next steps", "Use basic PAYE, VAT, CIT, and WHT calculators"].map(bullet)}</div>
            <div style={cardStyle()}>{["Track plans, billing, credits, and usage", "Connect supported WhatsApp or Telegram channels", "Keep support, help, and legal pages accessible"].map(bullet)}</div>
            <div style={cardStyle("warn")}>{["Complex cases should be verified", "Sensitive tax disputes should be escalated", "Official filing decisions remain the user's responsibility"].map(bullet)}</div>
          </div>
        </section>

        <section style={{ display: "grid", gap: 18 }}>
          {sectionTitle(
            "Sample questions",
            "See the kind of help users can expect.",
            "These examples make the product scope clearer before signup and help users decide whether the tool fits their needs."
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            {sampleQuestions.map((question) => (
              <div key={question} style={cardStyle()}>
                <div style={pillStyle()}>Example prompt</div>
                <strong style={{ color: "var(--text)", lineHeight: 1.5 }}>{question}</strong>
              </div>
            ))}
          </div>
        </section>

        <section style={{ display: "grid", gap: 18 }}>
          {sectionTitle(
            "Pricing snapshot",
            "Users can understand the model before login.",
            "The public pricing page explains free access, subscriptions, credit top-ups, and the boundary between general guidance and professional tax representation."
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>
            <div style={cardStyle()}><span style={pillStyle()}>Free Forever</span><strong style={{ fontSize: 24 }}>₦0</strong><p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.7 }}>Basic calculators, library answers, quiz learning, and calendar view.</p></div>
            <div style={cardStyle()}><span style={pillStyle()}>Starter</span><strong style={{ fontSize: 24 }}>From ₦5,000/mo</strong><p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.7 }}>AI answers, custom reminders, basic documents, and one messaging channel.</p></div>
            <div style={cardStyle("good")}><span style={pillStyle("good")}>Professional</span><strong style={{ fontSize: 24 }}>From ₦12,000/mo</strong><p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.7 }}>All core channels, advanced explanations, document generation, and priority support.</p></div>
            <div style={cardStyle()}><span style={pillStyle()}>Business</span><strong style={{ fontSize: 24 }}>From ₦25,000/mo</strong><p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.7 }}>Higher credits, business workflows, document review, and reporting support.</p></div>
          </div>
        </section>

        <section style={cardStyle("warn")}>
          <div style={pillStyle("warn")}>Safety and compliance posture</div>
          <h2 style={{ margin: 0, color: "var(--text)", fontSize: "clamp(28px, 5vw, 36px)", lineHeight: 1.1 }}>Built to answer carefully, not carelessly.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14 }}>
            {["General guidance should be verified before sensitive action", "High-risk matters should move to a qualified tax professional", "Users should avoid sharing unnecessary sensitive personal or financial data", "Tax rules and administrative practice can change, so important answers need source/date awareness"].map(bullet)}
          </div>
        </section>

        <section style={cardStyle()}>
          <div style={{ textAlign: "center", display: "grid", gap: 14 }}>
            <div style={pillStyle("good")}>Start now</div>
            <h2 style={{ margin: 0, color: "var(--text)", fontSize: "clamp(30px, 6vw, 44px)", lineHeight: 1.08, fontWeight: 950 }}>Step into a clearer Nigerian tax guidance workspace.</h2>
            <p style={{ margin: "0 auto", color: "var(--text-muted)", lineHeight: 1.85, maxWidth: 820 }}>
              Use the public pages to understand the product first, then sign in when you are ready to ask questions, manage credits, and connect supported channels.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
              <button onClick={goToApp} disabled={checkingSession} style={primaryButton(checkingSession)}>{appLabel}</button>
              <button onClick={() => router.push("/pricing")} style={secondaryButton()}>Review Plans First</button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
