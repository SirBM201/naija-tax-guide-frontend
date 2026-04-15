"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type ThemeChoice = "dark" | "light" | "system";
type SearchParamsLike = { get(name: string): string | null };

const BRAND_NAME = "Naija Tax Guide";
const BRAND_TAGLINE = "From Deep Roots, We Soar.";
const THEME_STORAGE_KEY = "ntg-theme-preference";

const BRAND_LOGO_CANDIDATES = [
  "/logo.png",
  "/logo.jpg",
  "/logo.jpeg",
  "/ntg-logo.png",
  "/ntg-logo.jpg",
  "/images/logo.png",
  "/images/logo.jpg",
  "/brand/logo.png",
];

function sanitizePath(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  const trimmed = value.trim();

  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;

  return trimmed;
}

function getSystemResolvedTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(choice: ThemeChoice): "dark" | "light" {
  return choice === "system" ? getSystemResolvedTheme() : choice;
}

function AuthLogo() {
  const [logoIndex, setLogoIndex] = useState(0);
  const [logoBroken, setLogoBroken] = useState(false);

  const logoSrc =
    BRAND_LOGO_CANDIDATES[Math.min(logoIndex, BRAND_LOGO_CANDIDATES.length - 1)];

  function handleLogoError() {
    if (logoIndex < BRAND_LOGO_CANDIDATES.length - 1) {
      setLogoIndex((prev) => prev + 1);
      return;
    }
    setLogoBroken(true);
  }

  return (
    <div className="logoBox">
      {!logoBroken ? (
        <img
          key={logoSrc}
          src={logoSrc}
          alt={BRAND_NAME}
          className="logoImage"
          onError={handleLogoError}
        />
      ) : (
        <div className="logoFallback">NTG</div>
      )}
    </div>
  );
}

function LoginPageContent({ searchParams }: { searchParams?: SearchParamsLike }) {
  const router = useRouter();

  const nextPath = useMemo(
    () => sanitizePath(searchParams?.get("next"), "/dashboard"),
    [searchParams]
  );

  const signupHref = useMemo(() => {
    if (!nextPath || nextPath === "/dashboard") return "/signup";
    return `/signup?next=${encodeURIComponent(nextPath)}`;
  }, [nextPath]);

  const [themeChoice, setThemeChoice] = useState<ThemeChoice>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("light");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [bannerTone, setBannerTone] = useState<"neutral" | "success" | "danger">("neutral");
  const [bannerText, setBannerText] = useState(
    "Sign in securely with your email address and one-time code to continue to your workspace."
  );

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? (window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeChoice | null)
        : null;

    const initialChoice: ThemeChoice =
      saved === "dark" || saved === "light" || saved === "system" ? saved : "system";

    const apply = (choice: ThemeChoice) => {
      const resolved = resolveTheme(choice);
      setThemeChoice(choice);
      setResolvedTheme(resolved);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(THEME_STORAGE_KEY, choice);
      }

      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", resolved);
      }
    };

    apply(initialChoice);

    if (typeof window === "undefined") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (themeChoice === "system") {
        const resolved = getSystemResolvedTheme();
        setResolvedTheme(resolved);
        document.documentElement.setAttribute("data-theme", resolved);
      }
    };

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handleChange);
      return () => media.removeEventListener("change", handleChange);
    }

    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, [themeChoice]);

  function applyTheme(choice: ThemeChoice) {
    const resolved = resolveTheme(choice);
    setThemeChoice(choice);
    setResolvedTheme(resolved);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, choice);
    }

    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", resolved);
    }
  }

  async function parseJson(response: Response) {
    try {
      return await response.json();
    } catch {
      return {};
    }
  }

  async function handleSendOtp() {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setBannerTone("danger");
      setBannerText("Enter your email address first.");
      return;
    }

    setSendingOtp(true);
    setBannerTone("neutral");
    setBannerText("Sending your one-time code...");

    try {
      const response = await fetch("/api/web/auth/request-otp", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
        }),
      });

      const data = await parseJson(response);

      if (!response.ok || data?.ok === false) {
        throw new Error();
      }

      setBannerTone("success");
      setBannerText("OTP sent successfully. Check your email inbox and enter the code below.");
    } catch {
      setBannerTone("danger");
      setBannerText("We could not send the one-time code right now. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyOtp() {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedOtp = otp.trim();

    if (!trimmedEmail || !trimmedOtp) {
      setBannerTone("danger");
      setBannerText("Enter both your email address and the one-time code.");
      return;
    }

    setVerifyingOtp(true);
    setBannerTone("neutral");
    setBannerText("Verifying your code...");

    try {
      const response = await fetch("/api/web/auth/verify-otp", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          otp: trimmedOtp,
        }),
      });

      const data = await parseJson(response);

      if (!response.ok || data?.ok === false) {
        throw new Error();
      }

      const destination = sanitizePath(
        typeof data?.redirect_to === "string" ? data.redirect_to : nextPath,
        "/dashboard"
      );

      setBannerTone("success");
      setBannerText("Sign-in successful. Opening your workspace...");
      router.replace(destination);
    } catch {
      setBannerTone("danger");
      setBannerText("We could not verify that code. Check the code and try again.");
    } finally {
      setVerifyingOtp(false);
    }
  }

  const themeVars =
    resolvedTheme === "dark"
      ? {
          "--page-bg": "#07101f",
          "--surface": "#0d1830",
          "--surface-soft": "#101d39",
          "--surface-muted": "#0b1730",
          "--border": "rgba(148, 163, 184, 0.22)",
          "--text": "#f8fafc",
          "--text-muted": "#cbd5e1",
          "--accent": "#818cf8",
          "--accent-strong": "#6366f1",
          "--accent-soft": "rgba(129, 140, 248, 0.14)",
          "--success-bg": "rgba(34, 197, 94, 0.10)",
          "--success-border": "rgba(34, 197, 94, 0.22)",
          "--danger-bg": "rgba(239, 68, 68, 0.12)",
          "--danger-border": "rgba(239, 68, 68, 0.24)",
          "--shadow": "0 18px 50px rgba(2, 6, 23, 0.36)",
        }
      : {
          "--page-bg": "#eef2f7",
          "--surface": "#ffffff",
          "--surface-soft": "#f8fafc",
          "--surface-muted": "#f5f7fb",
          "--border": "rgba(15, 23, 42, 0.10)",
          "--text": "#0f172a",
          "--text-muted": "#475569",
          "--accent": "#818cf8",
          "--accent-strong": "#6366f1",
          "--accent-soft": "rgba(129, 140, 248, 0.10)",
          "--success-bg": "rgba(34, 197, 94, 0.08)",
          "--success-border": "rgba(34, 197, 94, 0.20)",
          "--danger-bg": "rgba(239, 68, 68, 0.08)",
          "--danger-border": "rgba(239, 68, 68, 0.18)",
          "--shadow": "0 18px 50px rgba(15, 23, 42, 0.08)",
        };

  return (
    <div className="pageRoot" style={themeVars as React.CSSProperties}>
      <div className="shell">
        <div className="heroCard">
          <div className="heroTop">
            <AuthLogo />

            <div className="heroText">
              <h1>Welcome Back</h1>
              <div className="brandLine">{BRAND_NAME} Sign In</div>
              <p>
                Sign in securely with your email address and one-time code to continue to your
                workspace.
              </p>
            </div>
          </div>

          <div className="buttonRow">
            <button
              type="button"
              className={`themeButton ${themeChoice === "dark" ? "active" : ""}`}
              onClick={() => applyTheme("dark")}
            >
              Dark
            </button>
            <button
              type="button"
              className={`themeButton ${themeChoice === "light" ? "active" : ""}`}
              onClick={() => applyTheme("light")}
            >
              Light
            </button>
            <button
              type="button"
              className={`themeButton ${themeChoice === "system" ? "active" : ""}`}
              onClick={() => applyTheme("system")}
            >
              System
            </button>
          </div>

          <div className="buttonRow">
            <button
              type="button"
              className="primaryAction"
              onClick={() => router.push(signupHref)}
            >
              New here? Create account
            </button>

            <button type="button" className="secondaryAction" onClick={() => router.push("/")}>
              Open Welcome Page
            </button>
          </div>

          <div
            className={`banner ${
              bannerTone === "success"
                ? "success"
                : bannerTone === "danger"
                ? "danger"
                : "neutral"
            }`}
          >
            {bannerText}
          </div>

          <div className="contentGrid">
            <div className="mainCard">
              <label className="fieldLabel">Email Address</label>
              <input
                type="email"
                value={email}
                autoComplete="email"
                placeholder="Email address"
                className="input"
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="inlineButtons">
                <button
                  type="button"
                  className="smallAction"
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                >
                  {sendingOtp ? "Sending..." : "Send OTP"}
                </button>
              </div>

              <label className="fieldLabel">OTP Code</label>
              <input
                type="text"
                value={otp}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="OTP code"
                className="input"
                onChange={(e) => setOtp(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    void handleVerifyOtp();
                  }
                }}
              />

              <div className="inlineButtons">
                <button
                  type="button"
                  className="smallAction"
                  onClick={handleVerifyOtp}
                  disabled={verifyingOtp}
                >
                  {verifyingOtp ? "Verifying..." : "Verify OTP"}
                </button>
              </div>
            </div>

            <div className="sideStack">
              <div className="infoCard">
                <h3>New user?</h3>
                <p>Go to the separate sign-up page to start account creation properly.</p>
                <button type="button" className="fullAction" onClick={() => router.push(signupHref)}>
                  Open Sign Up
                </button>
              </div>

              <div className="infoCard">
                <h3>Referral handling</h3>
                <p>Sign-in preserves access flow, but only sign-up should apply a referral code.</p>
              </div>

              <div className="infoCard">
                <h3>Need help?</h3>
                <p>If sign-in fails after a proper attempt, use Support and try again after a short wait.</p>
                <button type="button" className="fullAction" onClick={() => router.push("/support")}>
                  Open Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .pageRoot {
          min-height: 100vh;
          background: var(--page-bg);
          padding: 32px 16px;
          color: var(--text);
        }

        .shell {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
        }

        .heroCard {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 32px;
          box-shadow: var(--shadow);
          padding: 36px;
          display: grid;
          gap: 24px;
        }

        .heroTop {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 28px;
          align-items: start;
        }

        .logoBox {
          width: 132px;
          height: 132px;
          border-radius: 28px;
          overflow: hidden;
          border: 1px solid var(--border);
          background: var(--surface-soft);
          flex-shrink: 0;
        }

        .logoImage {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .logoFallback {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          font-size: 24px;
          font-weight: 900;
          color: var(--text);
          background: var(--surface);
        }

        .heroText h1 {
          margin: 0;
          font-size: clamp(48px, 8vw, 92px);
          line-height: 0.95;
          letter-spacing: -0.04em;
          font-weight: 950;
        }

        .brandLine {
          margin-top: 10px;
          font-size: clamp(20px, 2.7vw, 28px);
          font-weight: 900;
          color: #b2692e;
        }

        .heroText p {
          margin: 18px 0 0;
          max-width: 880px;
          color: var(--text-muted);
          font-size: clamp(20px, 2.2vw, 22px);
          line-height: 1.55;
        }

        .buttonRow {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
        }

        .themeButton,
        .primaryAction,
        .secondaryAction,
        .smallAction,
        .fullAction {
          border-radius: 20px;
          border: 1px solid var(--border);
          font-weight: 900;
          cursor: pointer;
          transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;
        }

        .themeButton:hover,
        .primaryAction:hover,
        .secondaryAction:hover,
        .smallAction:hover,
        .fullAction:hover {
          transform: translateY(-1px);
        }

        .themeButton {
          min-height: 64px;
          padding: 0 24px;
          background: var(--surface-soft);
          color: var(--text);
          font-size: 18px;
        }

        .themeButton.active {
          background: var(--accent-soft);
          border-color: rgba(129, 140, 248, 0.35);
        }

        .primaryAction {
          min-height: 72px;
          padding: 0 24px;
          background: var(--accent-soft);
          color: var(--text);
          font-size: 20px;
        }

        .secondaryAction {
          min-height: 72px;
          padding: 0 24px;
          background: var(--surface-soft);
          color: var(--text);
          font-size: 20px;
        }

        .banner {
          border-radius: 22px;
          border: 1px solid var(--border);
          background: var(--surface-soft);
          padding: 22px 24px;
          font-size: 18px;
          line-height: 1.55;
        }

        .banner.success {
          background: var(--success-bg);
          border-color: var(--success-border);
        }

        .banner.danger {
          background: var(--danger-bg);
          border-color: var(--danger-border);
        }

        .contentGrid {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(300px, 0.8fr);
          gap: 20px;
          align-items: start;
        }

        .mainCard,
        .infoCard {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 26px;
          padding: 28px;
        }

        .sideStack {
          display: grid;
          gap: 20px;
        }

        .fieldLabel {
          display: block;
          margin-bottom: 12px;
          font-size: 18px;
          font-weight: 900;
          color: var(--text);
        }

        .input {
          width: 100%;
          min-height: 72px;
          border-radius: 20px;
          border: 1px solid var(--border);
          background: var(--surface-soft);
          color: var(--text);
          padding: 0 22px;
          font-size: 18px;
          outline: none;
        }

        .input::placeholder {
          color: var(--text-muted);
        }

        .inlineButtons {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin: 20px 0 28px;
        }

        .smallAction {
          min-height: 64px;
          padding: 0 26px;
          background: var(--accent-soft);
          color: var(--text);
          font-size: 18px;
        }

        .smallAction:disabled,
        .fullAction:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .infoCard h3 {
          margin: 0 0 12px;
          font-size: 22px;
          font-weight: 950;
        }

        .infoCard p {
          margin: 0;
          color: var(--text-muted);
          font-size: 18px;
          line-height: 1.6;
        }

        .fullAction {
          width: 100%;
          min-height: 66px;
          margin-top: 18px;
          padding: 0 20px;
          background: var(--accent-soft);
          color: var(--text);
          font-size: 18px;
        }

        @media (max-width: 980px) {
          .contentGrid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 780px) {
          .pageRoot {
            padding: 16px 10px;
          }

          .heroCard {
            padding: 20px;
            border-radius: 24px;
          }

          .heroTop {
            grid-template-columns: 1fr;
            gap: 18px;
          }

          .logoBox {
            width: 96px;
            height: 96px;
            border-radius: 22px;
          }

          .heroText h1 {
            font-size: clamp(40px, 14vw, 64px);
          }

          .brandLine {
            font-size: 18px;
          }

          .heroText p {
            font-size: 16px;
          }

          .themeButton,
          .primaryAction,
          .secondaryAction,
          .smallAction,
          .fullAction {
            width: 100%;
          }

          .buttonRow {
            display: grid;
            grid-template-columns: 1fr;
          }

          .mainCard,
          .infoCard {
            padding: 20px;
            border-radius: 22px;
          }

          .input {
            min-height: 64px;
            font-size: 16px;
          }

          .fieldLabel {
            font-size: 16px;
          }

          .infoCard h3 {
            font-size: 20px;
          }

          .infoCard p,
          .banner {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
}

function LoginSearchPage() {
  const searchParams = useSearchParams();
  return <LoginPageContent searchParams={searchParams} />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageContent />}>
      <LoginSearchPage />
    </Suspense>
  );
}
