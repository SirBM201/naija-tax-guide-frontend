"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
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

function resolvePostSignupPath(sp: ReturnType<typeof useSearchParams>) {
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

function clearStoredReferralCode() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
    window.localStorage.removeItem(REFERRAL_STORAGE_KEY);
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

function appendNext(url: string, nextPath: string): string {
  if (!nextPath) return url;
  const joiner = url.includes("?") ? "&" : "?";
  return `${url}${joiner}next=${encodeURIComponent(nextPath)}`;
}

function buildInitialNotice(referralCode: string, nextPath: string): NoticeState {
  if (referralCode && nextPath) {
    return {
      tone: "default",
      text: `Referral code ${referralCode} detected. Continue with sign-up and you will continue to ${nextPath} after verification.`,
    };
  }

  if (referralCode) {
    return {
      tone: "default",
      text: `Referral code ${referralCode} detected. Continue with sign-up to apply it to your new account.`,
    };
  }

  if (nextPath) {
    return {
      tone: "default",
      text: `Create your account with email OTP. After verification, you will continue to ${nextPath}.`,
    };
  }

  return {
    tone: "default",
    text: "Create your account with email OTP.",
  };
}

function requestOtpMessage(): string {
  return "Could not send OTP right now. Please confirm your email address and try again.";
}

function verifyOtpMessage(): string {
  return "That OTP could not be accepted. Request a new code and try again.";
}

function SignupPageContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const { themeMode, resolvedMode, setThemeMode } = useSharedTheme();
  const { setToken, setHasSession, refreshSession, hasSession, authReady } =
    useAuth();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [notice, setNotice] = useState<NoticeState>({
    tone: "default",
    text: "Create your account with email OTP.",
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
      setReferralCode(effectiveReferralCode);
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
            text: "Active session already exists in this browser. You can continue normally.",
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

  useEffect(() => {
    persistReferralCode(referralCode);
  }, [referralCode]);

  const sendOtp = async () => {
    const e = email.trim().toLowerCase();
    const normalizedReferral = normalizeReferralCode(referralCode);
    if (!e) return;

    setBusy(true);
    setNotice({
      tone: "default",
      text: "Sending sign-up OTP...",
    });

    try {
      const data = await apiJson<RequestOtpResp>("/web/auth/request-otp", {
        method: "POST",
        timeoutMs: 25000,
        body: {
          contact: e,
          purpose: "web_login",
        },
        useAuthToken: false,
      });

      if (data?.ok) {
        if (normalizedReferral && effectiveNextPath) {
          setNotice({
            tone: "good",
            text: `OTP sent successfully. Referral code ${normalizedReferral} is ready and you will continue to ${effectiveNextPath} after verification.`,
          });
        } else if (normalizedReferral) {
          setNotice({
            tone: "good",
            text: `OTP sent successfully. Referral code ${normalizedReferral} is ready for account creation.`,
          });
        } else {
          setNotice({
            tone: "good",
            text: "OTP sent successfully. Check your email inbox and enter the code below.",
          });
        }

        window.setTimeout(() => {
          otpInputRef.current?.focus();
        }, 120);
      } else {
        setNotice({
          tone: "warn",
          text: "OTP could not be sent right now. Please confirm the email address and try again.",
        });
      }
    } catch {
      setNotice({
        tone: "danger",
        text: requestOtpMessage(),
      });
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    const e = email.trim().toLowerCase();
    const code = otp.trim();
    const normalizedReferral = normalizeReferralCode(referralCode);
    if (!e || !code) return;

    setBusy(true);
    setNotice({
      tone: "default",
      text: "Verifying sign-up OTP...",
    });

    try {
      const data = await apiJson<VerifyOtpResp>("/web/auth/verify-otp", {
        method: "POST",
        timeoutMs: 25000,
        body: {
          contact: e,
          otp: code,
          purpose: "web_login",
          referral_code: normalizedReferral || undefined,
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

      if (normalizedReferral) {
        clearStoredReferralCode();
      }

      const finalPath = resolvePostSignupPath(sp);
      clearStoredNextPath();

      setNotice({
        tone: "good",
        text: "Account flow completed successfully. Redirecting...",
      });

      if (!redirectingRef.current) {
        redirectingRef.current = true;
        window.setTimeout(() => {
          router.replace(finalPath);
        }, 250);
      }
    } catch {
      setNotice({
        tone: "danger",
        text: verifyOtpMessage(),
      });
    } finally {
      setBusy(false);
    }
  };

  const clearReferral = () => {
    setReferralCode("");
    clearStoredReferralCode();
    setNotice({
      tone: "default",
      text: effectiveNextPath
        ? `Referral code cleared. After verification, you will continue to ${effectiveNextPath}.`
        : "Referral code cleared.",
    });
  };

  const nextPathForLinks = resolvePostSignupPath(sp);
  const loginHref = appendNext(
    "/login",
    nextPathForLinks === "/welcome" ? "" : nextPathForLinks
  );

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
              Create Account
            </div>
            <div
              style={{
                marginTop: 8,
                color: "var(--gold)",
                fontSize: 15,
                fontWeight: 800,
              }}
            >
              Naija Tax Guide Sign Up
            </div>
            <div
              style={{
                marginTop: 10,
                color: "var(--text-muted)",
                lineHeight: 1.6,
                fontSize: 15,
                maxWidth: 620,
              }}
            >
              Start your account securely with email OTP. Referral code support is available here so account creation can remain separated from normal sign-in.
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
          <button
            onClick={() => setThemeMode("dark")}
            style={themeChipStyle(themeMode === "dark")}
          >
            Dark
          </button>
          <button
            onClick={() => setThemeMode("light")}
            style={themeChipStyle(themeMode === "light")}
          >
            Light
          </button>
          <button
            onClick={() => setThemeMode("system")}
            style={themeChipStyle(themeMode === "system")}
          >
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
          <Link href={loginHref} style={linkBtnStyle(true)}>
            Already have an account? Sign in
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
            ...noticeStyle(checkingSession && !hasSession ? "default" : notice.tone),
          }}
        >
          {checkingSession && !hasSession
            ? "Checking secure access state..."
            : notice.text}
        </div>

        {hasSession ? (
          <div style={{ marginTop: 22 }}>
            <WorkspaceSectionCard
              title="Session already active"
              subtitle="This browser already has an authenticated session."
            >
              <WorkspaceActionBar
                items={[
                  {
                    label: "Continue to Dashboard",
                    onClick: () => router.replace("/dashboard"),
                    tone: "primary",
                    disabled: busy,
                  },
                  {
                    label: "Continue to Welcome",
                    onClick: () => router.replace("/welcome"),
                    tone: "secondary",
                    disabled: busy,
                  },
                ]}
              />
            </WorkspaceSectionCard>
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
              title="Sign Up"
              subtitle="Use your email address, optional referral code, and one-time code to create or initialize account access."
            >
              <WorkspaceField label="Email Address" htmlFor="signup-email">
                <input
                  id="signup-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  style={workspaceInputStyle()}
                  autoComplete="email"
                />
              </WorkspaceField>

              <WorkspaceField label="Referral Code (Optional)" htmlFor="signup-referral">
                <input
                  id="signup-referral"
                  value={referralCode}
                  onChange={(e) => setReferralCode(normalizeReferralCode(e.target.value))}
                  placeholder="Referral code"
                  style={workspaceInputStyle()}
                  autoComplete="off"
                />
              </WorkspaceField>

              <div
                style={{
                  marginTop: 8,
                  color: "var(--text-faint)",
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                If you opened a referral link, the code is applied automatically. You can also paste a code manually before verification.
              </div>

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
                  {
                    label: "Clear Referral",
                    onClick: clearReferral,
                    tone: "secondary",
                    disabled: busy || !referralCode,
                  },
                ]}
              />

              <WorkspaceField label="OTP Code" htmlFor="signup-otp">
                <input
                  id="signup-otp"
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
                <div style={sectionTitleStyle()}>Already registered?</div>
                <div style={sectionTextStyle()}>
                  Go to the separate sign-in page if you already have an account and only need workspace access.
                </div>
                <div style={{ marginTop: 12 }}>
                  <Link href={loginHref} style={linkBtnStyle(true)}>
                    Open Sign In
                  </Link>
                </div>
              </div>

              <div style={sectionCardStyle()}>
                <div style={sectionTitleStyle()}>Referral support</div>
                <div style={sectionTextStyle()}>
                  Sign-up is the only page that should apply a referral code to a new account.
                </div>
              </div>

              <div style={sectionCardStyle()}>
                <div style={sectionTitleStyle()}>Secure access method</div>
                <div style={sectionTextStyle()}>
                  Account access is initialized through email OTP verification using your current backend flow.
                </div>
              </div>

              <div style={sectionCardStyle()}>
                <div style={sectionTitleStyle()}>Need help?</div>
                <div style={sectionTextStyle()}>
                  If sign-up fails after a valid attempt, use Support and try again after a short wait.
                </div>
                <div style={{ marginTop: 12 }}>
                  <Link href="/support" style={linkBtnStyle(false)}>
                    Open Support
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}

function SignupPageFallback() {
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
        Loading sign-up...
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupPageFallback />}>
      <SignupPageContent />
    </Suspense>
  );
}
