"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiJson, isApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const BRAND_LOGO_SRC = "/logo.png";

type NoticeTone = "default" | "good" | "warn" | "danger";

function safeText(value: unknown, fallback = "") {
  const text =
    typeof value === "string"
      ? value.trim()
      : value == null
      ? ""
      : String(value).trim();

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

function pageBgStyle(): React.CSSProperties {
  return {
    minHeight: "100vh",
    background: "var(--page-bg)",
    padding: "24px 16px 40px",
  };
}

function shellStyle(): React.CSSProperties {
  return {
    width: "100%",
    maxWidth: 1180,
    margin: "0 auto",
    background: "var(--panel-bg)",
    border: "1px solid var(--border)",
    borderRadius: 34,
    boxShadow: "0 12px 40px rgba(15, 23, 42, 0.05)",
    overflow: "hidden",
  };
}

function contentWrapStyle(): React.CSSProperties {
  return {
    padding: 28,
    display: "grid",
    gap: 22,
  };
}

function sectionCardStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    borderRadius: 26,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    padding: 22,
    ...extra,
  };
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    minHeight: 58,
    borderRadius: 18,
    border: "1px solid var(--border-strong)",
    background: "var(--surface)",
    color: "var(--text)",
    padding: "0 18px",
    fontSize: 18,
    outline: "none",
  };
}

function primaryButtonStyle(disabled = false): React.CSSProperties {
  return {
    minHeight: 56,
    padding: "0 22px",
    borderRadius: 18,
    border: "1px solid var(--accent-border)",
    background: disabled ? "var(--surface-soft)" : "var(--button-bg-strong)",
    color: disabled ? "var(--text-faint)" : "var(--text)",
    fontWeight: 900,
    fontSize: 16,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.72 : 1,
  };
}

function secondaryButtonStyle(disabled = false): React.CSSProperties {
  return {
    minHeight: 56,
    padding: "0 22px",
    borderRadius: 18,
    border: "1px solid var(--border-strong)",
    background: disabled ? "var(--surface-soft)" : "var(--button-bg)",
    color: disabled ? "var(--text-faint)" : "var(--text)",
    fontWeight: 900,
    fontSize: 16,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.72 : 1,
  };
}

function themeButtonStyle(active: boolean): React.CSSProperties {
  return {
    minHeight: 52,
    padding: "0 20px",
    borderRadius: 18,
    border: active ? "1px solid var(--accent-border)" : "1px solid var(--border)",
    background: active ? "var(--accent-soft)" : "var(--surface)",
    color: "var(--text)",
    fontWeight: 900,
    fontSize: 16,
    cursor: "pointer",
  };
}

function toneStyle(tone: NoticeTone): React.CSSProperties {
  if (tone === "good") {
    return {
      border: "1px solid var(--success-border)",
      background: "var(--success-bg)",
    };
  }

  if (tone === "warn") {
    return {
      border: "1px solid var(--warn-border)",
      background: "var(--warn-bg)",
    };
  }

  if (tone === "danger") {
    return {
      border: "1px solid var(--danger-border)",
      background: "var(--danger-bg)",
    };
  }

  return {
    border: "1px solid var(--border)",
    background: "var(--surface-soft)",
  };
}

function extractFriendlyError(error: unknown, fallback: string) {
  if (isApiError(error)) {
    const data = (error as { data?: Record<string, unknown>; message?: string }).data || {};
    const rawCode = safeText(data.error, "").toLowerCase();
    const rawMessage = safeText(data.message, "").toLowerCase();

    if (rawCode.includes("expired") || rawMessage.includes("expired")) {
      return "This one-time code has expired. Request a new code and try again.";
    }

    if (rawCode.includes("invalid") || rawMessage.includes("invalid")) {
      return "The one-time code is not valid. Check the code and try again.";
    }

    if (rawCode.includes("rate") || rawMessage.includes("too many")) {
      return "Too many attempts were made. Please wait a little and try again.";
    }

    if (rawCode.includes("exists") || rawMessage.includes("already")) {
      return "An account may already exist for that email. Try signing in instead.";
    }

    return fallback;
  }

  return fallback;
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={pageBgStyle()}>
      <div style={shellStyle()}>
        <div style={contentWrapStyle()}>{children}</div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const { refreshSession } = useAuth();

  const [width, setWidth] = useState(1200);
  const [theme, setTheme] = useState<"dark" | "light" | "system">("system");
  const [logoBroken, setLogoBroken] = useState(false);

  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [noticeTone, setNoticeTone] = useState<NoticeTone>("default");
  const [noticeText, setNoticeText] = useState("Create your account with email OTP.");
  const [redirectTo, setRedirectTo] = useState("/dashboard");

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const saved =
      safeText(window.localStorage.getItem("ntg-theme")) ||
      safeText(window.localStorage.getItem("naija-tax-guide-theme")) ||
      safeText(window.localStorage.getItem("theme")) ||
      "system";

    if (saved === "dark" || saved === "light" || saved === "system") {
      setTheme(saved);
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

  useEffect(() => {
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

  const isMobile = width < 900;
  const isCompact = width < 640;

  const formGridStyle = useMemo<React.CSSProperties>(
    () => ({
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.35fr) minmax(280px, 0.95fr)",
      gap: 20,
      alignItems: "start",
    }),
    [isMobile]
  );

  async function handleSendOtp() {
    const cleanEmail = email.trim().toLowerCase();

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
          referral_code: safeText(referralCode, "") || undefined,
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
    const cleanOtp = otpCode.trim();
    const cleanReferral = referralCode.trim().toUpperCase();

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
      const response = await apiJson<{ ok?: boolean; redirect_to?: string }>("/web/auth/verify-otp", {
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

      if (refreshSession) {
        await refreshSession();
      }

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
    <AuthShell>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isCompact ? "1fr" : "auto 1fr",
          gap: isCompact ? 18 : 22,
          alignItems: "start",
        }}
      >
        <div
          style={{
            width: isCompact ? 88 : 108,
            height: isCompact ? 88 : 108,
            borderRadius: 26,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            display: "grid",
            placeItems: "center",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {!logoBroken ? (
            <img
              src={BRAND_LOGO_SRC}
              alt="Naija Tax Guide"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={() => setLogoBroken(true)}
            />
          ) : (
            <div
              style={{
                fontSize: 22,
                fontWeight: 950,
                color: "var(--text)",
              }}
            >
              NTG
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
          <div
            style={{
              fontSize: isCompact ? 44 : 66,
              lineHeight: 1,
              fontWeight: 950,
              letterSpacing: -1.2,
              color: "var(--text)",
              wordBreak: "break-word",
            }}
          >
            Create Account
          </div>

          <div
            style={{
              fontSize: isCompact ? 20 : 24,
              fontWeight: 900,
              color: "var(--brand-accent)",
            }}
          >
            Naija Tax Guide Sign Up
          </div>

          <div
            style={{
              maxWidth: 820,
              color: "var(--text-muted)",
              fontSize: isCompact ? 16 : 18,
              lineHeight: 1.75,
            }}
          >
            Start your account securely with email OTP. Referral code support is available here so account creation can remain separated from normal sign-in.
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <button style={themeButtonStyle(theme === "dark")} onClick={() => setTheme("dark")}>
          Dark
        </button>
        <button style={themeButtonStyle(theme === "light")} onClick={() => setTheme("light")}>
          Light
        </button>
        <button style={themeButtonStyle(theme === "system")} onClick={() => setTheme("system")}>
          System
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
        <button style={primaryButtonStyle(false)} onClick={() => router.push("/login")}>
          Already have an account? Sign in
        </button>

        <button style={secondaryButtonStyle(false)} onClick={() => router.push("/welcome")}>
          Open Welcome Page
        </button>
      </div>

      <div
        style={{
          ...sectionCardStyle(),
          ...toneStyle(noticeTone),
          padding: "20px 22px",
        }}
      >
        <div
          style={{
            color: "var(--text)",
            fontSize: isCompact ? 16 : 17,
            lineHeight: 1.7,
            wordBreak: "break-word",
          }}
        >
          {noticeText}
        </div>
      </div>

      <div style={formGridStyle}>
        <div style={sectionCardStyle({ minWidth: 0 })}>
          <div style={{ display: "grid", gap: 18 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <label
                style={{
                  color: "var(--text)",
                  fontWeight: 900,
                  fontSize: 16,
                }}
              >
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                style={inputStyle()}
                autoComplete="email"
              />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label
                style={{
                  color: "var(--text)",
                  fontWeight: 900,
                  fontSize: 16,
                }}
              >
                Referral Code (Optional)
              </label>

              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="Referral code"
                style={inputStyle()}
                autoComplete="off"
              />

              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                If you opened a referral link, the code is applied automatically. You can also paste a code manually before verification.
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <button
                style={secondaryButtonStyle(sendingOtp || verifyingOtp)}
                onClick={() => void handleSendOtp()}
                disabled={sendingOtp || verifyingOtp}
              >
                {sendingOtp ? "Sending..." : "Send OTP"}
              </button>

              <button
                style={secondaryButtonStyle(sendingOtp || verifyingOtp)}
                onClick={handleClearReferral}
                disabled={sendingOtp || verifyingOtp}
              >
                Clear Referral
              </button>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label
                style={{
                  color: "var(--text)",
                  fontWeight: 900,
                  fontSize: 16,
                }}
              >
                OTP Code
              </label>

              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="OTP code"
                style={inputStyle()}
                inputMode="numeric"
                autoComplete="one-time-code"
              />
            </div>

            <div>
              <button
                style={primaryButtonStyle(verifyingOtp || sendingOtp)}
                onClick={() => void handleVerifyOtp()}
                disabled={verifyingOtp || sendingOtp}
              >
                {verifyingOtp ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
          <div style={sectionCardStyle()}>
            <div
              style={{
                color: "var(--text)",
                fontWeight: 950,
                fontSize: 18,
                marginBottom: 10,
              }}
            >
              Already registered?
            </div>

            <div
              style={{
                color: "var(--text-muted)",
                fontSize: 16,
                lineHeight: 1.7,
                marginBottom: 18,
              }}
            >
              Go to the separate sign-in page if you already have an account and only need workspace access.
            </div>

            <button style={primaryButtonStyle(false)} onClick={() => router.push("/login")}>
              Open Sign In
            </button>
          </div>

          <div style={sectionCardStyle()}>
            <div
              style={{
                color: "var(--text)",
                fontWeight: 950,
                fontSize: 18,
                marginBottom: 10,
              }}
            >
              Referral support
            </div>

            <div
              style={{
                color: "var(--text-muted)",
                fontSize: 16,
                lineHeight: 1.7,
              }}
            >
              Sign-up is the only page that should apply a referral code to a new account.
            </div>
          </div>

          <div style={sectionCardStyle()}>
            <div
              style={{
                color: "var(--text)",
                fontWeight: 950,
                fontSize: 18,
                marginBottom: 10,
              }}
            >
              Secure access method
            </div>

            <div
              style={{
                color: "var(--text-muted)",
                fontSize: 16,
                lineHeight: 1.7,
              }}
            >
              Account access is initialized through email OTP verification using your current backend flow.
            </div>
          </div>

          <div style={sectionCardStyle()}>
            <div
              style={{
                color: "var(--text)",
                fontWeight: 950,
                fontSize: 18,
                marginBottom: 10,
              }}
            >
              Need help?
            </div>

            <div
              style={{
                color: "var(--text-muted)",
                fontSize: 16,
                lineHeight: 1.7,
                marginBottom: 16,
              }}
            >
              If sign-up fails after a valid attempt, use Support and try again after a short wait.
            </div>

            <button style={secondaryButtonStyle(false)} onClick={() => router.push("/support")}>
              Open Support
            </button>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
