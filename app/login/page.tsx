"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiJson } from "@/lib/api";
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
  ttl_minutes?: number;
  email_to?: string;
  message?: string;
};

type VerifyOtpResp = {
  ok?: boolean;
  token?: string;
  account_id?: string;
  message?: string;
};

type NoticeTone = "default" | "good" | "warn" | "danger";

type NoticeState = {
  tone: NoticeTone;
  text: string;
};

const REFERRAL_STORAGE_KEY = "ntg_referral_code";
const NEXT_PATH_STORAGE_KEY = "ntg_next_path";

function safeDecodeNext(nextValue: string | null): string | null {
  let raw = String(nextValue || "").trim();
  if (!raw) return null;

  for (let i = 0; i < 3; i += 1) {
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

function requestOtpMessage(): string {
  return "Could not send OTP right now. Please confirm your email address and try again.";
}

function verifyOtpMessage(): string {
  return "That OTP could not be accepted. Request a new code and try again.";
}

function authRootStyle(mode: "dark" | "light"): React.CSSProperties {
  return {
    minHeight: "100vh",
    background:
      mode === "light"
        ? "linear-gradient(180deg, #f5f7fb 0%, #eef3fb 100%)"
        : "radial-gradient(circle at top, rgba(99,102,241,0.16) 0%, rgba(5,8,22,1) 48%)",
    color: "var(--text)",
    ...themeVars(mode),
  };
}

function panelStyle(): React.CSSProperties {
  return {
    width: "100%",
    maxWidth: 1120,
    borderRadius: 28,
    border: "1px solid var(--border)",
    background: "var(--panel-bg)",
    padding: "clamp(18px, 3.5vw, 32px)",
    backdropFilter: "blur(12px)",
    boxShadow: "0 18px 50px rgba(2, 6, 23, 0.16)",
  };
}

function noticeStyle(tone: NoticeTone): React.CSSProperties {
  if (tone === "good") {
    return {
      border: "1px solid rgba(16,185,129,0.28)",
      background: "rgba(16,185,129,0.12)",
    };
  }

  if (tone === "warn") {
    return {
      border: "1px solid rgba(245,158,11,0.30)",
      background: "rgba(245,158,11,0.10)",
    };
  }

  if (tone === "danger") {
    return {
      border: "1px solid rgba(239,68,68,0.28)",
      background: "rgba(239,68,68,0.10)",
    };
  }

  return {
    border: "1px solid var(--border)",
    background: "var(--surface-soft)",
  };
}

function linkBtnStyle(primary = false): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: 46,
    padding: "11px 16px",
    borderRadius: 14,
    border: primary
      ? "1px solid var(--accent-border)"
      : "1px solid var(--border)",
    background: primary ? "var(--accent-soft)" : "var(--surface-soft)",
    color: "var(--text)",
    textDecoration: "none",
    fontWeight: 900,
    fontSize: 14,
    textAlign: "center",
  };
}

function infoCardStyle(): React.CSSProperties {
  return {
    borderRadius: 18,
    border: "1px solid var(--border)",
    background: "var(--surface-soft)",
    padding: 16,
    display: "grid",
    gap: 8,
  };
}

function infoTitleStyle(): React.CSSProperties {
  return {
    color: "var(--text)",
    fontWeight: 900,
    fontSize: 15,
  };
}

function infoTextStyle(): React.CSSProperties {
  return {
    color: "var(--text-faint)",
    lineHeight: 1.6,
    fontSize: 14,
  };
}

function authInput(): React.CSSProperties {
  return {
    ...workspaceInputStyle(),
    minHeight: 52,
    fontSize: 16,
  };
}

function LoginPageContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const { themeMode, resolvedMode, setThemeMode } = useSharedTheme();
  const { setToken, setHasSession, refreshSession, logout, hasSession, authReady } =
    useAuth();

  const [email, setEmail] = useState("");
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
  }, [effectiveNextPath, effectiveReferralCode]);

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
    effectiveNextPath,
    effectiveReferralCode,
    hasSession,
    refreshSession,
    setHasSession,
  ]);

  const sendOtp = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setNotice({ tone: "warn", text: "Please enter your email address." });
      return;
    }

    setBusy(true);
    setNotice({ tone: "default", text: "Sending sign-in OTP..." });

    try {
      // FIX: Changed from "/web/auth/request-otp" to "web/auth/request-otp" (removed leading slash)
      const data = await apiJson<RequestOtpResp>("web/auth/request-otp", {
        method: "POST",
        timeoutMs: 25000,
        body: { contact: normalizedEmail, purpose: "web_login" },
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
          text: data?.message || "OTP could not be sent right now. Please confirm the email address and try again.",
        });
      }
    } catch (error: any) {
      console.error("OTP request error:", error);
      setNotice({ tone: "danger", text: requestOtpMessage() });
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const code = otp.trim();
    if (!normalizedEmail || !code) {
      setNotice({ tone: "warn", text: "Please enter both email and OTP code." });
      return;
    }

    setBusy(true);
    setNotice({ tone: "default", text: "Verifying sign-in OTP..." });

    try {
      // FIX: Changed from "/web/auth/verify-otp" to "web/auth/verify-otp" (removed leading slash)
      const data = await apiJson<VerifyOtpResp>("web/auth/verify-otp", {
        method: "POST",
        timeoutMs: 25000,
        body: {
          contact: normalizedEmail,
          otp: code,
          purpose: "web_login",
        },
        useAuthToken: false,
      });

      if (!data?.ok) {
        setNotice({
          tone: "warn",
          text: data?.message || "That OTP could not be accepted. Request a new code and try again.",
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

      setNotice({ tone: "good", text: "OTP verified successfully. Redirecting..." });

      if (!redirectingRef.current) {
        redirectingRef.current = true;
        window.setTimeout(() => {
          router.replace(finalPath);
        }, 250);
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      setNotice({ tone: "danger", text: verifyOtpMessage() });
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

  const checkingText = checkingSession && !hasSession;
  const headerText = useMemo(() => {
    if (effectiveNextPath) {
      return "Sign in with your email and one-time code. After access is confirmed, you will continue exactly where you were heading.";
    }
    return "Sign in securely with your email address and one-time code to continue to your workspace.";
  }, [effectiveNextPath]);

  return (
    <div style={authRootStyle(resolvedMode)}>
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "clamp(14px, 4vw, 28px)",
        }}
      >
        <div style={panelStyle()}>
          <div style={{ display: "grid", gap: 24 }}>
            <div
              style={{
                display: "grid",
                gap: 18,
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                alignItems: "start",
              }}
            >
              <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                <div
                  style={{
                    position: "relative",
                    width: 76,
                    height: 76,
                    borderRadius: 20,
                    overflow: "hidden",
                    border: "1px solid var(--accent-border)",
                    background: "var(--surface)",
                    flexShrink: 0,
                  }}
                >
                  <Image
                    src="/bms-logo.jpg"
                    alt="BMS SparkVision Hub logo"
                    fill
                    sizes="76px"
                    style={{ objectFit: "cover" }}
                    priority
                  />
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: "clamp(1.9rem, 4vw, 2.7rem)",
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
                      fontSize: 14,
                      fontWeight: 800,
                      letterSpacing: 0.2,
                    }}
                  >
                    Naija Tax Guide Sign In
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      color: "var(--text-muted)",
                      lineHeight: 1.65,
                      fontSize: 15,
                      maxWidth: 640,
                    }}
                  >
                    {headerText}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 12,
                  alignContent: "start",
                  justifyItems: "start",
                }}
              >
                <div
                  style={{
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
                    display: "grid",
                    gap: 10,
                    width: "100%",
                    maxWidth: 360,
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  }}
                >
                  <Link href={signupHref} style={linkBtnStyle(true)}>
                    New here? Create account
                  </Link>
                  <Link href="/welcome" style={linkBtnStyle(false)}>
                    Open Welcome Page
                  </Link>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "14px 16px",
                borderRadius: 16,
                color: "var(--text-soft)",
                fontSize: 15,
                lineHeight: 1.6,
                ...noticeStyle(checkingText ? "default" : notice.tone),
              }}
            >
              {checkingText ? "Checking secure access state..." : notice.text}
            </div>

            {hasSession ? (
              <div style={{ display: "grid", gap: 14 }}>
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: 16,
                    border: "1px solid rgba(16,185,129,0.28)",
                    background: "rgba(16,185,129,0.12)",
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
                      label: effectiveNextPath
                        ? "Continue to Requested Page"
                        : "Continue to Dashboard",
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
                  display: "grid",
                  gap: 18,
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  alignItems: "start",
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
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="Email address"
                      style={authInput()}
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
                      onChange={(event) => setOtp(event.target.value)}
                      placeholder="OTP code"
                      style={authInput()}
                      autoComplete="one-time-code"
                      inputMode="numeric"
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
                  <div style={infoCardStyle()}>
                    <div style={infoTitleStyle()}>New user?</div>
                    <div style={infoTextStyle()}>
                      If this is your first visit, create your account on the separate sign-up page so referral handling stays correct.
                    </div>
                    <Link href={signupHref} style={{ ...linkBtnStyle(true), marginTop: 4 }}>
                      Open Sign Up
                    </Link>
                  </div>

                  <div style={infoCardStyle()}>
                    <div style={infoTitleStyle()}>Safe on mobile</div>
                    <div style={infoTextStyle()}>
                      This page now stacks cleanly on narrow screens so forms, actions, and notices do not overlap on phones.
                    </div>
                  </div>

                  <div style={infoCardStyle()}>
                    <div style={infoTitleStyle()}>Need help?</div>
                    <div style={infoTextStyle()}>
                      If you do not receive the code after a valid attempt, open Support and try again after a short wait.
                    </div>
                    <Link href="/support" style={{ ...linkBtnStyle(false), marginTop: 4 }}>
                      Open Support
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
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
        background: "#050816",
        color: "white",
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
