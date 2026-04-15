"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiJson, isApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { themeChipStyle, themeVars, useSharedTheme } from "@/lib/theme";
import { getWelcomeSeen } from "@/lib/preferences-storage";
import WorkspaceActionBar from "@/components/workspace-action-bar";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import {
  WorkspaceField,
  workspaceInputStyle,
} from "@/components/workspace-form";

type RequestOtpResp = {
  ok?: boolean;
  error?: string;
  why?: string;
  ttl_minutes?: number;
  email_to?: string;
  message?: string;
};

type VerifyOtpResp = {
  ok?: boolean;
  token?: string;
  account_id?: string;
  error?: string;
  message?: string;
};

type NoticeTone = "default" | "good" | "warn" | "danger";

type NoticeState = {
  tone: NoticeTone;
  text: string;
};

const REFERRAL_STORAGE_KEY = "ntg_referral_code";
const NEXT_PATH_STORAGE_KEY = "ntg_next_path";

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 980,
        borderRadius: 26,
        border: "1px solid var(--border)",
        background: "var(--panel-bg)",
        padding: 24,
        backdropFilter: "blur(12px)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
      }}
    >
      {children}
    </div>
  );
}

function safeDecodeNext(nextValue: string | null): string | null {
  let raw = String(nextValue || "").trim();
  if (!raw) return null;

  for (let i = 0; i < 3; i++) {
    try {
      const decoded = decodeURIComponent(raw).trim();
      if (decoded === raw) break;
      raw = decoded;
    } catch {
      break;
    }
  }

  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  if (raw === "/login" || raw.startsWith("/login?")) return null;
  if (raw === "/signup" || raw.startsWith("/signup?")) return null;
  return raw;
}

function readStoredNextPath(): string {
  if (typeof window === "undefined") return "";
  try {
    return (
      safeDecodeNext(
        window.sessionStorage.getItem(NEXT_PATH_STORAGE_KEY) ||
          window.localStorage.getItem(NEXT_PATH_STORAGE_KEY)
      ) || ""
    );
  } catch {
    return "";
  }
}

function persistNextPath(nextPath: string) {
  if (typeof window === "undefined") return;
  try {
    if (nextPath) {
      window.sessionStorage.setItem(NEXT_PATH_STORAGE_KEY, nextPath);
      window.localStorage.setItem(NEXT_PATH_STORAGE_KEY, nextPath);
    } else {
      window.sessionStorage.removeItem(NEXT_PATH_STORAGE_KEY);
      window.localStorage.removeItem(NEXT_PATH_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

function clearStoredNextPath() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(NEXT_PATH_STORAGE_KEY);
    window.localStorage.removeItem(NEXT_PATH_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function resolvePostLoginPath(sp: ReturnType<typeof useSearchParams>) {
  const queryNext = safeDecodeNext(sp?.get("next"));
  if (queryNext) return queryNext;

  const storedNext = readStoredNextPath();
  if (storedNext) return storedNext;

  return getWelcomeSeen() ? "/dashboard" : "/welcome";
}

function normalizeReferralCode(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "");
}

function readStoredReferralCode(): string {
  if (typeof window === "undefined") return "";
  try {
    return normalizeReferralCode(
      window.sessionStorage.getItem(REFERRAL_STORAGE_KEY) ||
        window.localStorage.getItem(REFERRAL_STORAGE_KEY)
    );
  } catch {
    return "";
  }
}

function persistReferralCode(code: string) {
  if (typeof window === "undefined") return;
  try {
    if (code) {
      window.sessionStorage.setItem(REFERRAL_STORAGE_KEY, code);
      window.localStorage.setItem(REFERRAL_STORAGE_KEY, code);
    } else {
      window.sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
      window.localStorage.removeItem(REFERRAL_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

function sectionCardStyle(): React.CSSProperties {
  return {
    borderRadius: 18,
    border: "1px solid var(--border)",
    background: "var(--surface-soft)",
    padding: 16,
  };
}

function sectionTitleStyle(): React.CSSProperties {
  return {
    color: "var(--text)",
    fontWeight: 900,
    fontSize: 15,
  };
}

function sectionTextStyle(): React.CSSProperties {
  return {
    marginTop: 8,
    color: "var(--text-faint)",
    lineHeight: 1.6,
  };
}

function linkBtnStyle(primary = false): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    padding: "10px 16px",
    borderRadius: 14,
    border: primary
      ? "1px solid var(--accent-border)"
      : "1px solid var(--border)",
    background: primary ? "var(--accent-soft)" : "var(--surface-soft)",
    color: "var(--text)",
    textDecoration: "none",
    fontWeight: 900,
    fontSize: 14,
  };
}

function noticeStyle(tone: NoticeTone): React.CSSProperties {
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

function appendParams(base: string, referralCode: string, nextPath: string): string {
  const params = new URLSearchParams();
  if (referralCode) params.set("ref", referralCode);
  if (nextPath) params.set("next", nextPath);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

function buildInitialNotice(referralCode: string, nextPath: string): NoticeState {
  if (referralCode && nextPath) {
    return {
      tone: "default",
      text: `Referral code ${referralCode} detected. If you are a new user, create your account first. After sign-in, you will continue to ${nextPath}.`,
    };
  }

  if (referralCode) {
    return {
      tone: "default",
      text: `Referral code ${referralCode} detected. If you are a new user, create your account first so the referral can be applied correctly.`,
    };
  }

  if (nextPath) {
    return {
      tone: "default",
      text: `Secure sign-in with email OTP. After access is completed, you will continue to ${nextPath}.`,
    };
  }

  return {
    tone: "default",
    text: "Secure sign-in with email OTP to continue to your workspace.",
  };
}

function friendlyRequestOtpError(err: unknown): string {
  if (isApiError(err)) {
    const code = String(err.data?.error || "").toLowerCase();
    const why = String(err.data?.why || "").toLowerCase();

    if (err.status === 429 || code.includes("rate")) {
      return "Too many OTP requests were made recently. Please wait a little and try again.";
    }

    if (code.includes("invalid") || why.includes("invalid")) {
      return "The email address could not be accepted. Please check it and try again.";
    }

    if (err.status >= 500) {
      return "The sign-in service is temporarily unavailable. Please try again shortly.";
    }
  }

  return "Could not send OTP right now. Please try again.";
}

function friendlyVerifyOtpError(err: unknown): string {
  if (isApiError(err)) {
    const code = String(err.data?.error || "").toLowerCase();
    const why = String(err.data?.why || "").toLowerCase();

    if (
      code.includes("invalid") ||
      code.includes("expired") ||
      why.includes("invalid") ||
      why.includes("expired")
    ) {
      return "That OTP is invalid or expired. Request a new code and try again.";
    }

    if (err.status === 429 || code.includes("rate")) {
      return "Too many verification attempts were made. Please wait a little and try again.";
    }

    if (err.status >= 500) {
      return "Verification is temporarily unavailable. Please try again shortly.";
    }
  }

  return "Could not verify OTP right now. Please try again.";
}

function LoginPageContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const { themeMode, resolvedMode, setThemeMode } = useSharedTheme();
  const { setToken, setHasSession, refreshSession, logout, hasSession, authReady } =
    useAuth();

  const [email, setEmail] = useState("sirbmsuper201@hotmail.com");
  const [otp, setOtp] = useState("");
  const [notice, setNotice] = useState<NoticeState>({
    tone: "default",
    text: "Secure sign-in with email OTP to continue to your workspace.",
  });
  const [busy, setBusy] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const redirectingRef = useRef(false);
  const initDoneRef = useRef(false);
  const otpInputRef = useRef<HTMLInputElement | null>(null);

  const queryReferralCode = normalizeReferralCode(sp?.get("ref"));
  const queryNextPath = safeDecodeNext(sp?.get("next")) || "";
  const storedReferralCode = readStoredReferralCode();
  const storedNextPath = readStoredNextPath();

  const effectiveReferralCode = queryReferralCode || storedReferralCode || "";
  const effectiveNextPath = queryNextPath || storedNextPath || "";

  useEffect(() => {
    if (initDoneRef.current) return;

    if (effectiveReferralCode) {
      persistReferralCode(effectiveReferralCode);
    }

    if (effectiveNextPath) {
      persistNextPath(effectiveNextPath);
    }

    setNotice(buildInitialNotice(effectiveReferralCode, effectiveNextPath));
    initDoneRef.current = true;
  }, [effectiveReferralCode, effectiveNextPath]);

  useEffect(() => {
    if (!authReady) return;

    let alive = true;

    const run = async () => {
      setCheckingSession(true);

      try {
        const ok = hasSession ? true : await refreshSession();

        if (!alive) return;

        if (ok) {
          setHasSession(true);
          setNotice({
            tone: "good",
            text: effectiveNextPath
              ? `Active session found in this browser. You can continue to ${effectiveNextPath} now.`
              : "Active session found in this browser.",
          });
        } else {
          setNotice(buildInitialNotice(effectiveReferralCode, effectiveNextPath));
        }
      } catch {
        if (!alive) return;
        setNotice(buildInitialNotice(effectiveReferralCode, effectiveNextPath));
      } finally {
        if (!alive) return;
        setCheckingSession(false);
      }
    };

    void run();

    return () => {
      alive = false;
    };
  }, [
    authReady,
    hasSession,
    refreshSession,
    setHasSession,
    effectiveReferralCode,
    effectiveNextPath,
  ]);

  const sendOtp = async () => {
    const e = email.trim().toLowerCase();
    if (!e) return;

    setBusy(true);
    setNotice({
      tone: "default",
      text: "Sending sign-in OTP...",
    });

    try {
      const data = await apiJson<RequestOtpResp>("/web/auth/request-otp", {
        method: "POST",
        timeoutMs: 25000,
        body: { contact: e, purpose: "web_login" },
        useAuthToken: false,
      });

      if (data?.ok) {
        setNotice({
          tone: "good",
          text: "OTP sent successfully. Check your email inbox and enter the code below.",
        });
        window.setTimeout(() => {
          otpInputRef.current?.focus();
        }, 120);
      } else {
        setNotice({
          tone: "warn",
          text: "OTP could not be sent right now. Please confirm the email address and try again.",
        });
      }
    } catch (err: unknown) {
      setNotice({
        tone: "danger",
        text: friendlyRequestOtpError(err),
      });
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    const e = email.trim().toLowerCase();
    const code = otp.trim();
    if (!e || !code) return;

    setBusy(true);
    setNotice({
      tone: "default",
      text: "Verifying sign-in OTP...",
    });

    try {
      const data = await apiJson<VerifyOtpResp>("/web/auth/verify-otp", {
        method: "POST",
        timeoutMs: 25000,
        body: {
          contact: e,
          otp: code,
          purpose: "web_login",
        },
        useAuthToken: false,
      });

      if (!data?.ok) {
        setNotice({
          tone: "warn",
          text: "That OTP could not be accepted. Request a new code and try again.",
        });
        return;
      }

      if (data?.token) {
        setToken(data.token);
      }

      try {
        await refreshSession();
      } catch {
        // ignore
      }

      setHasSession(true);

      const finalPath = resolvePostLoginPath(sp);
      clearStoredNextPath();

      setNotice({
        tone: "good",
        text: "OTP verified successfully. Redirecting...",
      });

      if (!redirectingRef.current) {
        redirectingRef.current = true;
        window.setTimeout(() => {
          router.replace(finalPath);
        }, 250);
      }
    } catch (err: unknown) {
      setNotice({
        tone: "danger",
        text: friendlyVerifyOtpError(err),
      });
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    setBusy(true);
    try {
      await logout();
      setHasSession(false);
      setOtp("");
      setNotice({
        tone: "good",
        text: "Session closed successfully. You can sign in again whenever you are ready.",
      });
    } finally {
      setBusy(false);
    }
  };

  const goDashboard = () => router.replace(effectiveNextPath || "/dashboard");
  const goWelcome = () => router.replace("/welcome?force=1");
  const signupHref = appendParams("/signup", effectiveReferralCode, effectiveNextPath);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "var(--app-bg)",
        color: "var(--text)",
        ...themeVars(resolvedMode),
      }}
    >
      <Panel>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "88px minmax(0,1fr)",
            gap: 18,
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 22,
              overflow: "hidden",
              border: "1px solid var(--accent-border)",
              background: "var(--surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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
                fontSize: 38,
                fontWeight: 950,
                letterSpacing: -0.8,
                color: "var(--text)",
                lineHeight: 1.05,
              }}
            >
              Welcome Back
            </div>
            <div
              style={{
                marginTop: 8,
                color: "var(--gold)",
                fontSize: 15,
                fontWeight: 800,
              }}
            >
              Naija Tax Guide Sign In
            </div>
            <div
              style={{
                marginTop: 10,
                color: "var(--text-muted)",
                lineHeight: 1.6,
                fontSize: 15,
                maxWidth: 560,
              }}
            >
              Sign in securely with your email address and one-time code to continue to your workspace.
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 20,
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <button onClick={() => setThemeMode("dark")} style={themeChipStyle(themeMode === "dark")}>
            Dark
          </button>
          <button onClick={() => setThemeMode("light")} style={themeChipStyle(themeMode === "light")}>
            Light
          </button>
          <button onClick={() => setThemeMode("system")} style={themeChipStyle(themeMode === "system")}>
            System
          </button>
        </div>

        <div
          style={{
            marginTop: 18,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Link href={signupHref} style={linkBtnStyle(true)}>
            New here? Create account
          </Link>
          <Link href="/welcome" style={linkBtnStyle(false)}>
            Open Welcome Page
          </Link>
        </div>

        <div
          style={{
            marginTop: 18,
            padding: "14px 16px",
            borderRadius: 16,
            color: "var(--text-soft)",
            fontSize: 15,
            lineHeight: 1.6,
            ...noticeStyle(
              checkingSession && !hasSession ? "default" : notice.tone
            ),
          }}
        >
          {checkingSession && !hasSession
            ? "Checking secure access state..."
            : notice.text}
        </div>

        {hasSession ? (
          <div style={{ marginTop: 22, display: "grid", gap: 14 }}>
            <div
              style={{
                padding: "14px 16px",
                borderRadius: 16,
                border: "1px solid var(--success-border)",
                background: "var(--success-bg)",
                color: "var(--text)",
                fontSize: 15,
                lineHeight: 1.6,
              }}
            >
              Active session found in this browser.
            </div>

            <WorkspaceActionBar
              items={[
                {
                  label: effectiveNextPath ? "Continue to Requested Page" : "Continue to Dashboard",
                  onClick: goDashboard,
                  tone: "primary",
                  disabled: busy,
                },
                {
                  label: "Open Welcome Page",
                  onClick: goWelcome,
                  tone: "secondary",
                  disabled: busy,
                },
                {
                  label: busy ? "Closing Session..." : "Logout",
                  onClick: () => {
                    void handleLogout();
                  },
                  tone: "danger",
                  disabled: busy,
                },
              ]}
            />
          </div>
        ) : (
          <div
            style={{
              marginTop: 22,
              display: "grid",
              gap: 18,
              gridTemplateColumns: "minmax(0,1.15fr) minmax(280px,0.85fr)",
            }}
          >
            <WorkspaceSectionCard
              title="Sign In"
              subtitle="Use your email address and one-time code to enter the workspace."
            >
              <WorkspaceField label="Email Address" htmlFor="login-email">
                <input
                  id="login-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  style={workspaceInputStyle()}
                  autoComplete="email"
                />
              </WorkspaceField>

              <WorkspaceActionBar
                items={[
                  {
                    label: busy ? "Sending..." : "Send OTP",
                    onClick: () => {
                      void sendOtp();
                    },
                    tone: "secondary",
                    disabled: busy || checkingSession || !email.trim(),
                  },
                ]}
              />

              <WorkspaceField label="OTP Code" htmlFor="login-otp">
                <input
                  id="login-otp"
                  ref={otpInputRef}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="OTP code"
                  style={workspaceInputStyle()}
                  autoComplete="one-time-code"
                />
              </WorkspaceField>

              <WorkspaceActionBar
                items={[
                  {
                    label: busy ? "Verifying..." : "Verify OTP",
                    onClick: () => {
                      void verifyOtp();
                    },
                    tone: "primary",
                    disabled: busy || checkingSession || !email.trim() || !otp.trim(),
                  },
                ]}
              />
            </WorkspaceSectionCard>

            <div style={{ display: "grid", gap: 14 }}>
              <div style={sectionCardStyle()}>
                <div style={sectionTitleStyle()}>New user?</div>
                <div style={sectionTextStyle()}>
                  Go to the separate sign-up page to start account creation and apply referral details correctly.
                </div>
                <div style={{ marginTop: 12 }}>
                  <Link href={signupHref} style={linkBtnStyle(true)}>
                    Open Sign Up
                  </Link>
                </div>
              </div>

              <div style={sectionCardStyle()}>
                <div style={sectionTitleStyle()}>Referral handling</div>
                <div style={sectionTextStyle()}>
                  Sign-in preserves detected referral codes for new users, but only sign-up should apply the code to account creation.
                </div>
              </div>

              <div style={sectionCardStyle()}>
                <div style={sectionTitleStyle()}>Redirect support</div>
                <div style={sectionTextStyle()}>
                  If a target page was requested before sign-in, it will be preserved and used after access is completed.
                </div>
              </div>

              <div style={sectionCardStyle()}>
                <div style={sectionTitleStyle()}>Need help?</div>
                <div style={sectionTextStyle()}>
                  If sign-in fails after a proper attempt, use Support and try again after a short wait.
                </div>
              </div>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}

function LoginPageFallback() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "var(--app-bg)",
        color: "var(--text)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          padding: 24,
          textAlign: "center",
        }}
      >
        Loading sign-in...
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
