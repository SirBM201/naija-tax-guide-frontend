"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiJson, isApiError } from "@/lib/api";

type NoticeTone = "default" | "good" | "warn" | "danger";

const BRAND_LOGO_SRC = "/logo.png";

function safeText(value: unknown, fallback = "") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function normalizePath(value: string, fallback: string) {
  const raw = safeText(value, "");
  if (!raw) return fallback;
  return raw.startsWith("/") ? raw : `/${raw}`;
}

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function extractFriendlyError(error: unknown, fallback: string) {
  if (isApiError(error)) {
    const data = (error as { data?: Record<string, unknown>; message?: string }).data || {};
    const rawError = safeText(data.error, "").toLowerCase();
    const rawMessage = safeText(data.message, "").toLowerCase();

    if (rawError.includes("expired") || rawMessage.includes("expired")) {
      return "This one-time code has expired. Request a new code and try again.";
    }

    if (rawError.includes("invalid") || rawMessage.includes("invalid")) {
      return "The one-time code is not valid. Check the code and try again.";
    }

    if (rawError.includes("rate") || rawMessage.includes("too many")) {
      return "Too many attempts were made. Please wait a little and try again.";
    }

    if (rawError.includes("exists") || rawMessage.includes("already")) {
      return "An account may already exist for that email. Try signing in instead.";
    }

    return fallback;
  }

  return fallback;
}

export default function SignupPage() {
  const router = useRouter();

  const [theme, setTheme] = useState<"dark" | "light" | "system">("system");
  const [logoBroken, setLogoBroken] = useState(false);

  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [redirectTo, setRedirectTo] = useState("/dashboard");

  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [noticeTone, setNoticeTone] = useState<NoticeTone>("default");
  const [noticeText, setNoticeText] = useState("Create your account with email OTP.");

  useEffect(() => {
    const saved =
      safeText(window.localStorage.getItem("ntg-theme")) ||
      safeText(window.localStorage.getItem("naija-tax-guide-theme")) ||
      safeText(window.localStorage.getItem("theme")) ||
      "system";

    if (saved === "dark" || saved === "light" || saved === "system") {
      setTheme(saved);
    }

    const params = new URLSearchParams(window.location.search);

    const detectedReferral =
      params.get("ref") ||
      params.get("referral") ||
      params.get("referral_code") ||
      "";

    const detectedRedirect =
      params.get("redirect") ||
      params.get("next") ||
      params.get("continue") ||
      params.get("continueTo") ||
      "/dashboard";

    setRedirectTo(normalizePath(detectedRedirect, "/dashboard"));

    if (detectedReferral) {
      const cleanReferral = safeText(detectedReferral, "").toUpperCase();
      setReferralCode(cleanReferral);
      setNoticeTone("good");
      setNoticeText(`Referral code ${cleanReferral} detected. Continue with sign-up to apply it.`);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const resolved =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;

    root.dataset.theme = resolved;
    window.localStorage.setItem("ntg-theme", theme);
    window.localStorage.setItem("naija-tax-guide-theme", theme);
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  async function handleSendOtp() {
    const cleanEmail = email.trim().toLowerCase();
    const cleanReferral = referralCode.trim().toUpperCase();

    if (!looksLikeEmail(cleanEmail)) {
      setNoticeTone("warn");
      setNoticeText("Enter a valid email address before requesting a one-time code.");
      return;
    }

    setSendingOtp(true);

    try {
      await apiJson("/web/auth/request-otp", {
        method: "POST",
        useAuthToken: false,
        timeoutMs: 15000,
        body: {
          email: cleanEmail,
          purpose: "signup",
          flow: "signup",
          channel: "web",
          referral_code: cleanReferral || undefined,
        },
      });

      setNoticeTone("good");
      setNoticeText("OTP sent successfully. Check your email inbox and enter the code below.");
    } catch (error: unknown) {
      setNoticeTone("danger");
      setNoticeText(
        extractFriendlyError(
          error,
          "We could not send the one-time code right now. Please try again shortly."
        )
      );
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyOtp() {
    const cleanEmail = email.trim().toLowerCase();
    const cleanReferral = referralCode.trim().toUpperCase();
    const cleanOtp = otpCode.trim();

    if (!looksLikeEmail(cleanEmail)) {
      setNoticeTone("warn");
      setNoticeText("Enter a valid email address before continuing.");
      return;
    }

    if (!cleanOtp) {
      setNoticeTone("warn");
      setNoticeText("Enter the one-time code that was sent to your email.");
      return;
    }

    setVerifyingOtp(true);

    try {
      const response = await apiJson<{ redirect_to?: string }>("/web/auth/verify-otp", {
        method: "POST",
        useAuthToken: false,
        timeoutMs: 15000,
        body: {
          email: cleanEmail,
          purpose: "signup",
          flow: "signup",
          code: cleanOtp,
          otp: cleanOtp,
          otp_code: cleanOtp,
          referral_code: cleanReferral || undefined,
          redirect_to: redirectTo,
        },
      });

      const finalRedirect = normalizePath(
        safeText(response?.redirect_to, redirectTo),
        redirectTo
      );

      router.replace(finalRedirect);
      router.refresh();
    } catch (error: unknown) {
      setNoticeTone("danger");
      setNoticeText(
        extractFriendlyError(
          error,
          "We could not complete account creation right now. Request a fresh code and try again."
        )
      );
    } finally {
      setVerifyingOtp(false);
    }
  }

  function handleClearReferral() {
    setReferralCode("");
    setNoticeTone("default");
    setNoticeText("Create your account with email OTP.");
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-content">
          <div className="hero">
            <div className="logo-box">
              {!logoBroken ? (
                <img
                  src={BRAND_LOGO_SRC}
                  alt="Naija Tax Guide"
                  className="logo-image"
                  onError={() => setLogoBroken(true)}
                />
              ) : (
                <div className="logo-fallback">NTG</div>
              )}
            </div>

            <div className="hero-copy">
              <h1>Create Account</h1>
              <div className="eyebrow">Naija Tax Guide Sign Up</div>
              <p>
                Start your account securely with email OTP. Referral code support is available here
                so account creation can remain separated from normal sign-in.
              </p>
            </div>
          </div>

          <div className="theme-row">
            <button
              type="button"
              className={`theme-btn ${theme === "dark" ? "active" : ""}`}
              onClick={() => setTheme("dark")}
            >
              Dark
            </button>
            <button
              type="button"
              className={`theme-btn ${theme === "light" ? "active" : ""}`}
              onClick={() => setTheme("light")}
            >
              Light
            </button>
            <button
              type="button"
              className={`theme-btn ${theme === "system" ? "active" : ""}`}
              onClick={() => setTheme("system")}
            >
              System
            </button>
          </div>

          <div className="top-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => router.push("/login")}
            >
              Already have an account? Sign in
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push("/welcome")}
            >
              Open Welcome Page
            </button>
          </div>

          <div className={`notice notice-${noticeTone}`}>{noticeText}</div>

          <div className="main-grid">
            <div className="card form-card">
              <div className="field-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  autoComplete="email"
                />
              </div>

              <div className="field-group">
                <label>Referral Code (Optional)</label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="Referral code"
                  autoComplete="off"
                />
                <div className="helper-text">
                  If you opened a referral link, the code is applied automatically. You can also paste a code manually before verification.
                </div>
              </div>

              <div className="field-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => void handleSendOtp()}
                  disabled={sendingOtp || verifyingOtp}
                >
                  {sendingOtp ? "Sending..." : "Send OTP"}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleClearReferral}
                  disabled={sendingOtp || verifyingOtp}
                >
                  Clear Referral
                </button>
              </div>

              <div className="field-group">
                <label>OTP Code</label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="OTP code"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                />
              </div>

              <div className="field-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void handleVerifyOtp()}
                  disabled={sendingOtp || verifyingOtp}
                >
                  {verifyingOtp ? "Verifying..." : "Verify OTP"}
                </button>
              </div>
            </div>

            <div className="side-stack">
              <div className="card info-card">
                <h3>Already registered?</h3>
                <p>
                  Go to the separate sign-in page if you already have an account and only need workspace access.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => router.push("/login")}
                >
                  Open Sign In
                </button>
              </div>

              <div className="card info-card">
                <h3>Referral support</h3>
                <p>Sign-up is the only page that should apply a referral code to a new account.</p>
              </div>

              <div className="card info-card">
                <h3>Secure access method</h3>
                <p>Account access is initialized through email OTP verification using your current backend flow.</p>
              </div>

              <div className="card info-card">
                <h3>Need help?</h3>
                <p>If sign-up fails after a valid attempt, use Support and try again after a short wait.</p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => router.push("/support")}
                >
                  Open Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          background: var(--page-bg, #f4f6fb);
          padding: 20px 14px 36px;
        }

        .auth-shell {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
          background: var(--panel-bg, #ffffff);
          border: 1px solid var(--border, #d9deea);
          border-radius: 34px;
          box-shadow: 0 12px 40px rgba(15, 23, 42, 0.05);
          overflow: hidden;
        }

        .auth-content {
          padding: 26px;
          display: grid;
          gap: 20px;
        }

        .hero {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 22px;
          align-items: start;
        }

        .logo-box {
          width: 108px;
          height: 108px;
          border-radius: 26px;
          overflow: hidden;
          border: 1px solid var(--border, #d9deea);
          background: var(--surface, #ffffff);
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .logo-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .logo-fallback {
          font-size: 24px;
          font-weight: 900;
          color: var(--text, #0f172a);
        }

        .hero-copy {
          min-width: 0;
          display: grid;
          gap: 10px;
        }

        .hero-copy h1 {
          margin: 0;
          font-size: clamp(48px, 7vw, 74px);
          line-height: 0.95;
          letter-spacing: -1.3px;
          color: var(--text, #0f172a);
          word-break: break-word;
        }

        .eyebrow {
          font-size: 24px;
          font-weight: 900;
          color: var(--brand-accent, #a85b1f);
        }

        .hero-copy p {
          margin: 0;
          color: var(--text-muted, #5e687b);
          font-size: 18px;
          line-height: 1.75;
          max-width: 860px;
        }

        .theme-row,
        .top-actions,
        .field-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .theme-btn,
        .btn {
          min-height: 54px;
          padding: 0 20px;
          border-radius: 18px;
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .theme-btn {
          border: 1px solid var(--border, #d9deea);
          background: var(--surface, #ffffff);
          color: var(--text, #0f172a);
        }

        .theme-btn.active {
          border-color: var(--accent-border, #c7c9ff);
          background: var(--accent-soft, #eef0ff);
        }

        .btn {
          border: 1px solid var(--border-strong, #ccd2e2);
          background: var(--button-bg, #f5f7fb);
          color: var(--text, #0f172a);
        }

        .btn-primary {
          border-color: var(--accent-border, #c7c9ff);
          background: var(--button-bg-strong, #eef0ff);
        }

        .btn:disabled {
          opacity: 0.72;
          cursor: not-allowed;
        }

        .notice {
          border-radius: 22px;
          padding: 18px 20px;
          border: 1px solid var(--border, #d9deea);
          background: var(--surface-soft, #f8f9fd);
          color: var(--text, #0f172a);
          font-size: 17px;
          line-height: 1.7;
          word-break: break-word;
        }

        .notice-good {
          background: var(--success-bg, rgba(34, 197, 94, 0.08));
          border-color: var(--success-border, rgba(34, 197, 94, 0.22));
        }

        .notice-warn {
          background: var(--warn-bg, rgba(245, 158, 11, 0.08));
          border-color: var(--warn-border, rgba(245, 158, 11, 0.22));
        }

        .notice-danger {
          background: var(--danger-bg, rgba(239, 68, 68, 0.08));
          border-color: var(--danger-border, rgba(239, 68, 68, 0.22));
        }

        .main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.95fr);
          gap: 20px;
          align-items: start;
        }

        .card {
          border-radius: 26px;
          border: 1px solid var(--border, #d9deea);
          background: var(--surface, #ffffff);
          padding: 22px;
          min-width: 0;
        }

        .form-card {
          display: grid;
          gap: 18px;
        }

        .field-group {
          display: grid;
          gap: 8px;
        }

        .field-group label {
          color: var(--text, #0f172a);
          font-size: 16px;
          font-weight: 900;
        }

        .field-group input {
          width: 100%;
          min-height: 58px;
          border-radius: 18px;
          border: 1px solid var(--border-strong, #ccd2e2);
          background: var(--surface, #ffffff);
          color: var(--text, #0f172a);
          padding: 0 18px;
          font-size: 18px;
          outline: none;
          box-sizing: border-box;
        }

        .helper-text {
          color: var(--text-muted, #5e687b);
          font-size: 14px;
          line-height: 1.7;
        }

        .side-stack {
          display: grid;
          gap: 16px;
          min-width: 0;
        }

        .info-card {
          display: grid;
          gap: 12px;
        }

        .info-card h3 {
          margin: 0;
          color: var(--text, #0f172a);
          font-size: 18px;
          font-weight: 900;
        }

        .info-card p {
          margin: 0;
          color: var(--text-muted, #5e687b);
          font-size: 16px;
          line-height: 1.7;
        }

        @media (max-width: 960px) {
          .main-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .auth-content {
            padding: 18px;
            gap: 16px;
          }

          .hero {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .logo-box {
            width: 88px;
            height: 88px;
          }

          .eyebrow {
            font-size: 20px;
          }

          .hero-copy p {
            font-size: 16px;
          }

          .theme-row,
          .top-actions,
          .field-actions {
            display: grid;
            grid-template-columns: 1fr;
          }

          .theme-btn,
          .btn {
            width: 100%;
          }

          .card {
            padding: 18px;
            border-radius: 22px;
          }

          .field-group input {
            min-height: 54px;
            font-size: 17px;
          }

          .notice {
            font-size: 16px;
            padding: 16px 18px;
          }
        }
      `}</style>
    </div>
  );
}
