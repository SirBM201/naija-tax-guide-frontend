"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiJson, isApiError } from "@/lib/api";
import { CONFIG } from "@/lib/config";
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
  debug?: unknown;
  message?: string;
};

type VerifyOtpResp = {
  ok?: boolean;
  token?: string;
  account_id?: string;
  error?: string;
  debug?: unknown;
  message?: string;
};

type WebMeResp = {
  ok?: boolean;
  account_id?: string;
  error?: string;
  debug?: unknown;
};

type FailureExpose = {
  stage: "send_otp" | "verify_otp" | "refresh_session" | "unknown";
  endpoint: string;
  apiBase: string;
  method: string;
  requestBody?: unknown;
  status?: number | null;
  message?: string;
  error?: string;
  raw?: unknown;
  likelyCause?: string;
  at: string;
};

const REFERRAL_STORAGE_KEY = "ntg_referral_code";

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

function resolvePostLoginPath(sp: ReturnType<typeof useSearchParams>) {
  const nextPath = safeDecodeNext(sp?.get("next"));
  if (nextPath) return nextPath;
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
    // ignore storage failures
  }
}

function likelyCauseFromError(status?: number | null, payload?: unknown, message?: string) {
  const text = `${message || ""} ${JSON.stringify(payload || {})}`.toLowerCase();

  if (!status) {
    if (text.includes("failed to fetch")) {
      return "Frontend could not reach backend. Check backend URL, backend server status, CORS, or network refusal.";
    }
    if (text.includes("timeout")) {
      return "Request timed out before backend responded.";
    }
    return "Network-level or browser fetch failure before a normal backend response was returned.";
  }

  if (status === 404) return "Backend route not found. Check that the auth endpoint exists on the backend.";
  if (status === 400) return "Backend rejected the request payload or validation failed.";
  if (status === 401 || status === 403) return "Backend blocked the request due to auth, security, or environment checks.";
  if (status === 429) return "Rate limit triggered for OTP or auth requests.";
  if (status >= 500) return "Backend internal error, provider failure, missing env vars, or unhandled exception.";

  return "Backend responded with an error that needs inspection from the raw payload below.";
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

function LoginPageContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const { themeMode, resolvedMode, setThemeMode } = useSharedTheme();
  const { setToken, setHasSession, refreshSession, logout, hasSession, authReady } = useAuth();

  const [email, setEmail] = useState("sirbmsuper201@hotmail.com");
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState<string>("Secure sign-in with email OTP.");
  const [raw, setRaw] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [failureExpose, setFailureExpose] = useState<FailureExpose | null>(null);

  const redirectingRef = useRef(false);
  const referralInitDoneRef = useRef(false);

  useEffect(() => {
    if (referralInitDoneRef.current) return;
    const urlRef = normalizeReferralCode(sp?.get("ref"));
    const stored = readStoredReferralCode();
    const finalCode = urlRef || stored || "";
    if (finalCode) {
      persistReferralCode(finalCode);
    }
    referralInitDoneRef.current = true;
  }, [sp]);

  useEffect(() => {
    if (!authReady) return;
    if (redirectingRef.current) return;

    const run = async () => {
      try {
        const ok = await refreshSession();
        if (ok) {
          setStatus("Active session detected. Redirecting...");
          redirectingRef.current = true;
          router.replace(resolvePostLoginPath(sp));
          return;
        }
        setStatus("Secure sign-in with email OTP.");
      } catch (err: unknown) {
        setFailureExpose({
          stage: "refresh_session",
          endpoint: "/web/auth/me",
          apiBase: CONFIG.apiBase || "",
          method: "GET",
          status: isApiError(err) ? err.status : null,
          message: isApiError(err) ? err.message : String(err instanceof Error ? err.message : err),
          error: isApiError(err) ? (err.data?.error as string | undefined) || "refresh_failed" : "refresh_failed",
          raw: isApiError(err) ? err.data : String(err instanceof Error ? err.message : err),
          likelyCause: likelyCauseFromError(
            isApiError(err) ? err.status : null,
            isApiError(err) ? err.data : null,
            String(err instanceof Error ? err.message : err)
          ),
          at: new Date().toISOString(),
        });
        setStatus("Secure sign-in with email OTP.");
      }
    };

    void run();
  }, [authReady, refreshSession, router, sp]);

  const sendOtp = async () => {
    const e = email.trim().toLowerCase();
    if (!e) return;

    setBusy(true);
    setStatus("Sending sign-in OTP...");
    setRaw(null);
    setFailureExpose(null);

    const requestBody = { contact: e, purpose: "web_login" };

    try {
      const data = await apiJson<RequestOtpResp>("/web/auth/request-otp", {
        method: "POST",
        timeoutMs: 25000,
        body: requestBody,
        useAuthToken: false,
      });

      setRaw(data);

      if (data?.ok) {
        setStatus("OTP sent successfully. Check your inbox or test mailbox.");
      } else {
        setStatus(`Send OTP failed (${data?.error || "unknown_error"})`);
        setFailureExpose({
          stage: "send_otp",
          endpoint: "/web/auth/request-otp",
          apiBase: CONFIG.apiBase || "",
          method: "POST",
          requestBody,
          status: 200,
          message: data?.message || "Backend returned non-ok payload",
          error: data?.error || "unknown_error",
          raw: data,
          likelyCause: likelyCauseFromError(200, data, data?.message),
          at: new Date().toISOString(),
        });
      }
    } catch (err: unknown) {
      if (isApiError(err)) {
        setStatus(`Send OTP failed (${err.status})`);
        setRaw(err.data ?? null);
        setFailureExpose({
          stage: "send_otp",
          endpoint: "/web/auth/request-otp",
          apiBase: CONFIG.apiBase || "",
          method: "POST",
          requestBody,
          status: err.status,
          message: err.message,
          error: (err.data?.error as string | undefined) || "api_error",
          raw: err.data ?? null,
          likelyCause: likelyCauseFromError(err.status, err.data, err.message),
          at: new Date().toISOString(),
        });
      } else {
        const msg = String(err instanceof Error ? err.message : err);
        setStatus("Send OTP failed.");
        setRaw(msg);
        setFailureExpose({
          stage: "send_otp",
          endpoint: "/web/auth/request-otp",
          apiBase: CONFIG.apiBase || "",
          method: "POST",
          requestBody,
          status: null,
          message: msg,
          error: "fetch_failure",
          raw: msg,
          likelyCause: likelyCauseFromError(null, null, msg),
          at: new Date().toISOString(),
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    const e = email.trim().toLowerCase();
    const code = otp.trim();
    if (!e || !code) return;

    setBusy(true);
    setStatus("Verifying sign-in OTP...");
    setRaw(null);
    setFailureExpose(null);

    const requestBody = {
      contact: e,
      otp: code,
      purpose: "web_login",
    };

    try {
      const data = await apiJson<VerifyOtpResp>("/web/auth/verify-otp", {
        method: "POST",
        timeoutMs: 25000,
        body: requestBody,
        useAuthToken: false,
      });

      setRaw(data);

      if (!data?.ok) {
        setStatus(`Verify OTP failed (${data?.error || "unknown_error"})`);
        setFailureExpose({
          stage: "verify_otp",
          endpoint: "/web/auth/verify-otp",
          apiBase: CONFIG.apiBase || "",
          method: "POST",
          requestBody: { ...requestBody, otp: "***hidden***" },
          status: 200,
          message: data?.message || "Backend returned non-ok payload",
          error: data?.error || "unknown_error",
          raw: data,
          likelyCause: likelyCauseFromError(200, data, data?.message),
          at: new Date().toISOString(),
        });
        return;
      }

      if (data?.token) {
        setToken(data.token);
      }

      setHasSession(true);

      try {
        const me = await apiJson<WebMeResp>("/web/auth/me", {
          method: "GET",
          timeoutMs: 20000,
          useAuthToken: false,
        });
        if (me?.ok && me?.account_id) {
          setHasSession(true);
        }
      } catch {
        // ignore
      }

      setStatus("OTP verified. Redirecting...");

      if (!redirectingRef.current) {
        redirectingRef.current = true;
        window.setTimeout(() => {
          router.replace(resolvePostLoginPath(sp));
        }, 250);
      }
    } catch (err: unknown) {
      if (isApiError(err)) {
        setStatus(`Verify OTP failed (${err.status})`);
        setRaw(err.data ?? null);
        setFailureExpose({
          stage: "verify_otp",
          endpoint: "/web/auth/verify-otp",
          apiBase: CONFIG.apiBase || "",
          method: "POST",
          requestBody: { ...requestBody, otp: "***hidden***" },
          status: err.status,
          message: err.message,
          error: (err.data?.error as string | undefined) || "api_error",
          raw: err.data ?? null,
          likelyCause: likelyCauseFromError(err.status, err.data, err.message),
          at: new Date().toISOString(),
        });
      } else {
        const msg = String(err instanceof Error ? err.message : err);
        setStatus("Verify OTP failed.");
        setRaw(msg);
        setFailureExpose({
          stage: "verify_otp",
          endpoint: "/web/auth/verify-otp",
          apiBase: CONFIG.apiBase || "",
          method: "POST",
          requestBody: { ...requestBody, otp: "***hidden***" },
          status: null,
          message: msg,
          error: "fetch_failure",
          raw: msg,
          likelyCause: likelyCauseFromError(null, null, msg),
          at: new Date().toISOString(),
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const goDashboard = () => router.replace("/dashboard");
  const goWelcome = () => router.replace("/welcome?force=1");

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
          <Link href="/signup" style={linkBtnStyle(true)}>
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
            border: hasSession
              ? "1px solid var(--success-border)"
              : "1px solid var(--border)",
            background: hasSession ? "var(--success-bg)" : "var(--surface-soft)",
            color: "var(--text-soft)",
            fontSize: 15,
            lineHeight: 1.6,
          }}
        >
          {status}
        </div>

        {failureExpose ? (
          <div
            style={{
              marginTop: 16,
              padding: "14px 16px",
              borderRadius: 16,
              border: "1px solid var(--danger-border)",
              background: "var(--danger-bg)",
              color: "var(--text)",
              fontSize: 14,
              lineHeight: 1.65,
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Failure Exposer</div>
            <div><strong>Stage:</strong> {failureExpose.stage}</div>
            <div><strong>Method:</strong> {failureExpose.method}</div>
            <div><strong>Endpoint:</strong> {failureExpose.endpoint}</div>
            <div><strong>API Base:</strong> {failureExpose.apiBase || "Not set"}</div>
            <div><strong>Status:</strong> {failureExpose.status ?? "No HTTP status returned"}</div>
            <div><strong>Error:</strong> {failureExpose.error || "None"}</div>
            <div><strong>Message:</strong> {failureExpose.message || "None"}</div>
            <div><strong>Likely Cause:</strong> {failureExpose.likelyCause || "Undetermined"}</div>
            <div><strong>Time:</strong> {failureExpose.at}</div>
          </div>
        ) : null}

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
                { label: "Continue to Dashboard", onClick: goDashboard, tone: "primary", disabled: busy },
                { label: "Open Welcome Page", onClick: goWelcome, tone: "secondary", disabled: busy },
                { label: "Logout / Close Session", onClick: () => { void logout(); }, tone: "danger", disabled: busy },
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
                />
              </WorkspaceField>

              <WorkspaceActionBar
                items={[
                  { label: "Send OTP", onClick: () => { void sendOtp(); }, tone: "secondary", disabled: busy },
                ]}
              />

              <WorkspaceField label="OTP Code" htmlFor="login-otp">
                <input
                  id="login-otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="OTP code"
                  style={workspaceInputStyle()}
                />
              </WorkspaceField>

              <WorkspaceActionBar
                items={[
                  { label: "Verify OTP", onClick: () => { void verifyOtp(); }, tone: "primary", disabled: busy },
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
                  <Link href="/signup" style={linkBtnStyle(true)}>
                    Open Sign Up
                  </Link>
                </div>
              </div>

              <div style={sectionCardStyle()}>
                <div style={sectionTitleStyle()}>Access Method</div>
                <div style={sectionTextStyle()}>
                  Secure email OTP sign-in for authenticated workspace access.
                </div>
              </div>

              <div style={sectionCardStyle()}>
                <div style={sectionTitleStyle()}>Product Scope</div>
                <div style={sectionTextStyle()}>
                  Nigeria-focused tax guidance workspace for freelancers, SMEs, and digital users.
                </div>
              </div>

              <div style={sectionCardStyle()}>
                <div style={sectionTitleStyle()}>Need help?</div>
                <div style={sectionTextStyle()}>
                  If sign-in fails after a proper attempt, use Support after checking the debug response.
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <WorkspaceActionBar
            items={[
              {
                label: showDebug ? "Hide Debug Response" : "Show Debug Response",
                onClick: () => setShowDebug((v) => !v),
                tone: "secondary",
              },
            ]}
          />
        </div>

        {showDebug ? (
          <div style={{ marginTop: 18 }}>
            <div
              style={{
                color: "var(--text-soft)",
                fontWeight: 900,
                marginBottom: 8,
              }}
            >
              Raw response (debug)
            </div>
            <pre
              style={{
                margin: 0,
                padding: 16,
                borderRadius: 16,
                border: "1px solid var(--border)",
                background: "var(--surface-soft)",
                color: "var(--text-soft)",
                whiteSpace: "pre-wrap",
                fontFamily: "ui-monospace, Menlo, monospace",
                fontSize: 12,
                lineHeight: 1.5,
                overflowX: "auto",
              }}
            >
              {JSON.stringify({ failureExpose, raw }, null, 2)}
            </pre>
          </div>
        ) : null}
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