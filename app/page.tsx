"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiJson } from "@/lib/api";
import { themeChipStyle, themeVars, useSharedTheme } from "@/lib/theme";

type WebMeResp = {
  ok?: boolean;
  account_id?: string;
  error?: string;
};

function primaryButton(disabled = false): React.CSSProperties {
  return {
    padding: "16px 20px",
    borderRadius: 18,
    border: "1px solid var(--accent-border)",
    background: disabled ? "#e5e7eb" : "var(--button-bg-strong)",
    color: disabled ? "#6b7280" : "var(--text)",
    fontWeight: 900,
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 15,
    boxShadow: disabled ? "none" : undefined,
    width: "100%",
    maxWidth: 320,
  };
}

function secondaryButton(disabled = false): React.CSSProperties {
  return {
    padding: "16px 20px",
    borderRadius: 18,
    border: "1px solid var(--border-strong)",
    background: disabled ? "#f3f4f6" : "var(--button-bg)",
    color: disabled ? "#6b7280" : "var(--text)",
    fontWeight: 900,
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 15,
    boxShadow: disabled ? "none" : undefined,
    width: "100%",
    maxWidth: 320,
  };
}

function sectionCardStyle(): React.CSSProperties {
  return {
    borderRadius: 24,
    border: "1px solid var(--border)",
    background: "var(--panel-bg)",
    padding: 24,
    backdropFilter: "blur(10px)",
  };
}

function metricCardStyle(
  tone: "default" | "good" | "warn" = "default"
): React.CSSProperties {
  let border = "1px solid var(--border)";
  let bg = "var(--surface-soft)";

  if (tone === "good") {
    border = "1px solid var(--success-border)";
    bg = "var(--success-bg)";
  } else if (tone === "warn") {
    border = "1px solid var(--warn-border)";
    bg = "var(--warn-bg)";
  }

  return {
    borderRadius: 20,
    border,
    background: bg,
    padding: 20,
    minWidth: 0,
  };
}

function featureCardStyle(): React.CSSProperties {
  return {
    borderRadius: 20,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    padding: 20,
    height: "100%",
    minWidth: 0,
  };
}

function channelCardStyle(): React.CSSProperties {
  return {
    borderRadius: 20,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    padding: 20,
    height: "100%",
    minWidth: 0,
  };
}

function infoPillStyle(): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    padding: "8px 12px",
    color: "var(--text-soft)",
    fontSize: 13,
    fontWeight: 700,
    maxWidth: "100%",
    flexWrap: "wrap",
  };
}

function numberBadgeStyle(): React.CSSProperties {
  return {
    width: 42,
    height: 42,
    borderRadius: 999,
    background: "var(--gold-soft)",
    color: "var(--gold)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: 16,
    flexShrink: 0,
  };
}

function LandingSectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {eyebrow ? (
        <div
          style={{
            color: "var(--gold)",
            fontWeight: 800,
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: 0.6,
          }}
        >
          {eyebrow}
        </div>
      ) : null}

      <div
        style={{
          color: "var(--text)",
          fontWeight: 950,
          fontSize: "clamp(28px, 5vw, 34px)",
          lineHeight: 1.1,
          letterSpacing: -0.8,
        }}
      >
        {title}
      </div>

      {subtitle ? (
        <div
          style={{
            color: "var(--text-muted)",
            fontSize: "clamp(15px, 2.4vw, 16px)",
            lineHeight: 1.75,
            maxWidth: 860,
          }}
        >
          {subtitle}
        </div>
      ) : null}
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

        if (!alive) return;
        setHasSession(Boolean(data?.ok && data?.account_id));
      } catch {
        if (!alive) return;
        setHasSession(false);
      } finally {
        if (!alive) return;
        setCheckingSession(false);
      }
    };

    void checkSession();

    return () => {
      alive = false;
    };
  }, []);

  const goToPrimary = () => {
    if (hasSession) {
      router.push("/dashboard");
      return;
    }
    router.push("/login");
  };

  const goToSecondary = () => {
    if (hasSession) {
      router.push("/welcome");
      return;
    }
    router.push("/login");
  };

  const topRouteLabel = checkingSession
    ? "Checking..."
    : hasSession
      ? "Dashboard"
      : "Login";

  const primaryLabel = checkingSession
    ? "Get Started"
    : hasSession
      ? "Continue to Dashboard"
      : "Get Started";

  const heroPrimaryLabel = checkingSession
    ? "Start Using Naija Tax Guide"
    : hasSession
      ? "Continue to Dashboard"
      : "Start Using Naija Tax Guide";

  const heroSecondaryLabel = checkingSession
    ? "Explore the Product"
    : hasSession
      ? "Open Welcome Page"
      : "Explore the Product";

  const finalCtaPrimaryLabel = checkingSession
    ? "Get Started"
    : hasSession
      ? "Continue to Dashboard"
      : "Get Started";

  const finalCtaSecondaryLabel = checkingSession
    ? "Login to Workspace"
    : hasSession
      ? "Open Welcome Page"
      : "Login to Workspace";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--app-bg)",
        color: "var(--text)",
        ...themeVars(resolvedMode),
      }}
    >
      <div
        style={{
          maxWidth: 1380,
          margin: "0 auto",
          padding: "18px 14px 64px",
        }}
      >
        <header
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "56px minmax(0,1fr)",
              gap: 12,
              alignItems: "center",
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                overflow: "hidden",
                border: "1px solid var(--accent-border)",
                background: "var(--surface-strong)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <img
                src="/bms-logo.jpg"
                alt="BMS logo"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  color: "var(--text)",
                  fontWeight: 950,
                  fontSize: "clamp(20px, 4vw, 24px)",
                  lineHeight: 1.05,
                  letterSpacing: -0.5,
                  wordBreak: "break-word",
                }}
              >
                Naija Tax Guide
              </div>
              <div
                style={{
                  marginTop: 6,
                  color: "var(--gold)",
                  fontWeight: 800,
                  fontSize: 13,
                  wordBreak: "break-word",
                }}
              >
                From Deep Roots, We Soar.
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
              gap: 10,
              alignItems: "stretch",
            }}
          >
            <button
              onClick={() => setThemeMode("dark")}
              style={{ ...themeChipStyle(themeMode === "dark"), width: "100%" }}
            >
              Dark
            </button>
            <button
              onClick={() => setThemeMode("light")}
              style={{ ...themeChipStyle(themeMode === "light"), width: "100%" }}
            >
              Light
            </button>
            <button
              onClick={() => setThemeMode("system")}
              style={{ ...themeChipStyle(themeMode === "system"), width: "100%" }}
            >
              System
            </button>

            <button
              onClick={() => router.push(hasSession ? "/dashboard" : "/login")}
              disabled={checkingSession}
              aria-disabled={checkingSession}
              style={{ ...secondaryButton(checkingSession), maxWidth: "100%" }}
            >
              {topRouteLabel}
            </button>

            <button
              onClick={goToPrimary}
              disabled={checkingSession}
              aria-disabled={checkingSession}
              style={{ ...primaryButton(checkingSession), maxWidth: "100%" }}
            >
              {primaryLabel}
            </button>
          </div>
        </header>

        <section
          style={{
            ...sectionCardStyle(),
            padding: 22,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 20,
              alignItems: "center",
            }}
          >
            <div style={{ display: "grid", gap: 18, minWidth: 0 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  borderRadius: 999,
                  border: "1px solid var(--accent-border)",
                  background: "var(--accent-soft)",
                  color: "var(--text)",
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: 800,
                  width: "fit-content",
                  maxWidth: "100%",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: "var(--accent)",
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                Built for Nigerian freelancers, SMEs, and digital professionals
              </div>

              <div
                style={{
                  fontSize: "clamp(34px, 8vw, 56px)",
                  fontWeight: 950,
                  lineHeight: 1.02,
                  letterSpacing: -1.5,
                  color: "var(--text)",
                  maxWidth: 820,
                  wordBreak: "break-word",
                }}
              >
                Smart tax guidance for Nigerians who want clarity, speed, and confidence.
              </div>

              <div
                style={{
                  fontSize: "clamp(16px, 2.6vw, 18px)",
                  color: "var(--text-muted)",
                  lineHeight: 1.85,
                  maxWidth: 820,
                }}
              >
                Naija Tax Guide helps users understand tax questions clearly,
                manage usage professionally, and access guidance through a clean
                AI-powered workspace designed for Nigeria. It is built to reduce
                confusion, improve confidence, and make tax guidance more
                accessible for freelancers, small businesses, creators, and
                growing digital entrepreneurs.
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 12,
                }}
              >
                <button
                  onClick={goToPrimary}
                  disabled={checkingSession}
                  aria-disabled={checkingSession}
                  style={{ ...primaryButton(checkingSession), maxWidth: "100%" }}
                >
                  {heroPrimaryLabel}
                </button>

                <button
                  onClick={goToSecondary}
                  disabled={checkingSession}
                  aria-disabled={checkingSession}
                  style={{ ...secondaryButton(checkingSession), maxWidth: "100%" }}
                >
                  {heroSecondaryLabel}
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div style={infoPillStyle()}>AI Tax Assistant</div>
                <div style={infoPillStyle()}>Web + WhatsApp + Telegram</div>
                <div style={infoPillStyle()}>Nigeria-Focused Guidance</div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 16,
                minWidth: 0,
              }}
            >
              <div style={metricCardStyle("good")}>
                <div style={{ color: "var(--text-faint)", fontSize: 13 }}>
                  Core Experience
                </div>
                <div
                  style={{
                    marginTop: 8,
                    color: "var(--text)",
                    fontWeight: 900,
                    fontSize: "clamp(24px, 5vw, 28px)",
                    lineHeight: 1.15,
                    wordBreak: "break-word",
                  }}
                >
                  Guided AI Tax Support
                </div>
                <div
                  style={{
                    marginTop: 10,
                    color: "var(--text-faint)",
                    lineHeight: 1.6,
                    fontSize: 14,
                  }}
                >
                  Ask tax questions clearly and receive structured responses in a
                  professional workspace.
                </div>
              </div>

              <div style={metricCardStyle()}>
                <div style={{ color: "var(--text-faint)", fontSize: 13 }}>
                  Version 1 Channels
                </div>
                <div
                  style={{
                    marginTop: 8,
                    color: "var(--text)",
                    fontWeight: 900,
                    fontSize: "clamp(24px, 5vw, 28px)",
                    lineHeight: 1.15,
                    wordBreak: "break-word",
                  }}
                >
                  Web, WhatsApp, Telegram
                </div>
                <div
                  style={{
                    marginTop: 10,
                    color: "var(--text-faint)",
                    lineHeight: 1.6,
                    fontSize: 14,
                  }}
                >
                  One account, one subscription, and one shared usage model
                  across supported channels.
                </div>
              </div>

              <div style={metricCardStyle("warn")}>
                <div style={{ color: "var(--text-faint)", fontSize: 13 }}>
                  Positioning
                </div>
                <div
                  style={{
                    marginTop: 8,
                    color: "var(--text)",
                    fontWeight: 900,
                    fontSize: "clamp(24px, 5vw, 28px)",
                    lineHeight: 1.15,
                    wordBreak: "break-word",
                  }}
                >
                  Nigerian but Premium
                </div>
                <div
                  style={{
                    marginTop: 10,
                    color: "var(--text-faint)",
                    lineHeight: 1.6,
                    fontSize: 14,
                  }}
                >
                  Strong local relevance without looking like a government portal
                  or a casual social app.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <LandingSectionTitle
            eyebrow="Why users will care"
            title="A product designed around real tax confusion, not abstract AI hype."
            subtitle="Many users do not need more noise. They need clearer direction, faster answers, better confidence, and a more organized way to manage tax-related questions."
          />

          <div
            style={{
              marginTop: 22,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 18,
            }}
          >
            <div style={featureCardStyle()}>
              <div style={{ color: "var(--gold)", fontWeight: 900, fontSize: 18 }}>
                Clarity
              </div>
              <div
                style={{
                  marginTop: 10,
                  color: "var(--text)",
                  fontSize: 20,
                  fontWeight: 900,
                }}
              >
                Understand tax questions more easily
              </div>
              <div
                style={{
                  marginTop: 12,
                  color: "var(--text-muted)",
                  lineHeight: 1.75,
                }}
              >
                Users can ask in simple language and receive more structured
                guidance without digging through scattered sources.
              </div>
            </div>

            <div style={featureCardStyle()}>
              <div style={{ color: "var(--gold)", fontWeight: 900, fontSize: 18 }}>
                Speed
              </div>
              <div
                style={{
                  marginTop: 10,
                  color: "var(--text)",
                  fontSize: 20,
                  fontWeight: 900,
                }}
              >
                Get answers faster in one workspace
              </div>
              <div
                style={{
                  marginTop: 12,
                  color: "var(--text-muted)",
                  lineHeight: 1.75,
                }}
              >
                Instead of waiting, searching endlessly, or guessing, users can
                go straight into a guided question flow.
              </div>
            </div>

            <div style={featureCardStyle()}>
              <div style={{ color: "var(--gold)", fontWeight: 900, fontSize: 18 }}>
                Control
              </div>
              <div
                style={{
                  marginTop: 10,
                  color: "var(--text)",
                  fontSize: 20,
                  fontWeight: 900,
                }}
              >
                Track usage, credits, and plans professionally
              </div>
              <div
                style={{
                  marginTop: 12,
                  color: "var(--text-muted)",
                  lineHeight: 1.75,
                }}
              >
                The app is not just an answer box. It is a proper workspace with
                history, billing, credits, support, and clear user visibility.
              </div>
            </div>

            <div style={featureCardStyle()}>
              <div style={{ color: "var(--gold)", fontWeight: 900, fontSize: 18 }}>
                Localization
              </div>
              <div
                style={{
                  marginTop: 10,
                  color: "var(--text)",
                  fontSize: 20,
                  fontWeight: 900,
                }}
              >
                Built with Nigeria in mind
              </div>
              <div
                style={{
                  marginTop: 12,
                  color: "var(--text-muted)",
                  lineHeight: 1.75,
                }}
              >
                Language options, product direction, and messaging are designed
                to feel relevant to Nigerian users without losing a premium SaaS
                feel.
              </div>
            </div>
          </div>
        </section>

        <section style={{ marginTop: 34 }}>
          <LandingSectionTitle
            eyebrow="How it works"
            title="Simple for users. Structured underneath."
            subtitle="Naija Tax Guide is designed to feel easy on the outside while maintaining a proper commercial and compliance-ready workflow behind the scenes."
          />

          <div
            style={{
              marginTop: 22,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
              gap: 18,
            }}
          >
            <div style={featureCardStyle()}>
              <div style={numberBadgeStyle()}>1</div>
              <div
                style={{
                  marginTop: 14,
                  color: "var(--text)",
                  fontSize: 21,
                  fontWeight: 900,
                }}
              >
                Sign in securely
              </div>
              <div
                style={{
                  marginTop: 10,
                  color: "var(--text-muted)",
                  lineHeight: 1.75,
                }}
              >
                Users enter their email, receive a one-time code, and access a
                secure workspace designed for guided tax support.
              </div>
            </div>

            <div style={featureCardStyle()}>
              <div style={numberBadgeStyle()}>2</div>
              <div
                style={{
                  marginTop: 14,
                  color: "var(--text)",
                  fontSize: 21,
                  fontWeight: 900,
                }}
              >
                Ask tax questions clearly
              </div>
              <div
                style={{
                  marginTop: 10,
                  color: "var(--text-muted)",
                  lineHeight: 1.75,
                }}
              >
                Users ask questions directly inside the web workspace and later
                through supported messaging channels.
              </div>
            </div>

            <div style={featureCardStyle()}>
              <div style={numberBadgeStyle()}>3</div>
              <div
                style={{
                  marginTop: 14,
                  color: "var(--text)",
                  fontSize: 21,
                  fontWeight: 900,
                }}
              >
                Manage everything in one place
              </div>
              <div
                style={{
                  marginTop: 10,
                  color: "var(--text-muted)",
                  lineHeight: 1.75,
                }}
              >
                The workspace brings together history, credits, billing, plans,
                help, channels, support, and settings in one professional system.
              </div>
            </div>
          </div>
        </section>

        <section style={{ marginTop: 34 }}>
          <LandingSectionTitle
            eyebrow="Version 1 channels"
            title="Users are not limited to one access point."
            subtitle="The first launch is designed around a unified access model so supported channels feel connected instead of fragmented."
          />

          <div
            style={{
              marginTop: 22,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 18,
            }}
          >
            <div style={channelCardStyle()}>
              <div style={{ color: "var(--text)", fontWeight: 900, fontSize: 22 }}>
                Web Portal
              </div>
              <div
                style={{
                  marginTop: 12,
                  color: "var(--text-muted)",
                  lineHeight: 1.75,
                }}
              >
                The main management workspace for account access, AI questions,
                history, credits, billing, plans, help, and settings.
              </div>
            </div>

            <div style={channelCardStyle()}>
              <div style={{ color: "var(--text)", fontWeight: 900, fontSize: 22 }}>
                WhatsApp
              </div>
              <div
                style={{
                  marginTop: 12,
                  color: "var(--text-muted)",
                  lineHeight: 1.75,
                }}
              >
                Mobile-first access for users who prefer chat-based interaction
                while staying under the same account and usage model.
              </div>
            </div>

            <div style={channelCardStyle()}>
              <div style={{ color: "var(--text)", fontWeight: 900, fontSize: 22 }}>
                Telegram
              </div>
              <div
                style={{
                  marginTop: 12,
                  color: "var(--text-muted)",
                  lineHeight: 1.75,
                }}
              >
                Flexible bot-based access for users who want another structured
                messaging path under the same product logic.
              </div>
            </div>
          </div>
        </section>

        <section style={{ marginTop: 34 }}>
          <LandingSectionTitle
            eyebrow="Trust and positioning"
            title="Professional enough to inspire confidence."
            subtitle="Naija Tax Guide should feel credible, useful, and commercially structured from the first screen."
          />

          <div
            style={{
              marginTop: 22,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
              gap: 18,
            }}
          >
            <div style={sectionCardStyle()}>
              <div style={{ color: "var(--text)", fontWeight: 900, fontSize: 22 }}>
                What users should feel immediately
              </div>
              <div
                style={{
                  marginTop: 14,
                  display: "grid",
                  gap: 12,
                  color: "var(--text-muted)",
                  lineHeight: 1.75,
                  wordBreak: "break-word",
                }}
              >
                <div>• This app is built for Nigerian realities.</div>
                <div>• This app is organized, not scattered.</div>
                <div>• This app is easier to use than digging through random advice.</div>
                <div>• This app respects professional presentation and commercial structure.</div>
                <div>• This app can grow with their needs over time.</div>
              </div>
            </div>

            <div style={sectionCardStyle()}>
              <div style={{ color: "var(--text)", fontWeight: 900, fontSize: 22 }}>
                Important scope note
              </div>
              <div
                style={{
                  marginTop: 14,
                  color: "var(--text-muted)",
                  lineHeight: 1.85,
                }}
              >
                Naija Tax Guide is designed to provide guided tax support and
                structured user assistance. It is not presented as official
                government representation or a substitute for qualified
                professional escalation in highly sensitive or advanced cases.
              </div>

              <div
                style={{
                  marginTop: 18,
                  padding: "14px 16px",
                  borderRadius: 16,
                  border: "1px solid var(--warn-border)",
                  background: "var(--warn-bg)",
                  color: "var(--text-soft)",
                  lineHeight: 1.7,
                  wordBreak: "break-word",
                }}
              >
                This is exactly why the product can remain both useful and
                trustworthy: it aims for clarity and structure without pretending
                to be something it is not.
              </div>
            </div>
          </div>
        </section>

        <section style={{ marginTop: 38 }}>
          <div
            style={{
              ...sectionCardStyle(),
              textAlign: "center",
              padding: 24,
            }}
          >
            <div
              style={{
                color: "var(--gold)",
                fontWeight: 800,
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 0.6,
              }}
            >
              Start now
            </div>

            <div
              style={{
                marginTop: 10,
                color: "var(--text)",
                fontWeight: 950,
                fontSize: "clamp(30px, 6vw, 42px)",
                lineHeight: 1.08,
                letterSpacing: -1.2,
                wordBreak: "break-word",
              }}
            >
              Step into a smarter Nigerian tax guidance workspace.
            </div>

            <div
              style={{
                marginTop: 14,
                color: "var(--text-muted)",
                fontSize: "clamp(15px, 2.5vw, 17px)",
                lineHeight: 1.85,
                maxWidth: 820,
                marginInline: "auto",
              }}
            >
              Enter a product designed to help users ask better questions, get
              clearer guidance, manage access professionally, and grow with
              confidence.
            </div>

            <div
              style={{
                marginTop: 22,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <button
                onClick={goToPrimary}
                disabled={checkingSession}
                aria-disabled={checkingSession}
                style={{ ...primaryButton(checkingSession), maxWidth: "100%" }}
              >
                {finalCtaPrimaryLabel}
              </button>

              <button
                onClick={() => router.push(hasSession ? "/welcome" : "/login")}
                disabled={checkingSession}
                aria-disabled={checkingSession}
                style={{ ...secondaryButton(checkingSession), maxWidth: "100%" }}
              >
                {finalCtaSecondaryLabel}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
