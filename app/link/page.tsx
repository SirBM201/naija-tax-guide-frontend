"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { backendPost } from "@/lib/backend";

type Provider = "wa" | "tg";

type CreateLinkTokenResponse =
  | {
      ok: true;
      code: string;
      expires_at?: string | null;
      ttl_minutes?: number | null;
    }
  | {
      ok: false;
      error?: string;
      message?: string;
    };

function isCode(v: string) {
  return /^[A-Z0-9]{8}$/.test(v.trim().toUpperCase());
}

function fmtCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function normalizeErrorMessage(e: any): string {
  const msg = String(e?.message || "").trim();

  // Browser typically throws TypeError: Failed to fetch when:
  // - CORS blocked
  // - backend down
  // - wrong URL
  if (!msg || msg.toLowerCase().includes("failed to fetch")) {
    return "Network error: unable to reach the backend (check NEXT_PUBLIC_BACKEND_URL, backend running, and CORS).";
  }
  return msg;
}

function providerLabel(p: Provider) {
  return p === "wa" ? "WhatsApp" : "Telegram";
}

export default function LinkPage() {
  const [loading, setLoading] = useState(true);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  const [provider, setProvider] = useState<Provider>("wa");
  const [busy, setBusy] = useState<Provider | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [code, setCode] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<number | null>(null);

  // ticker for countdown
  const [nowMs, setNowMs] = useState<number>(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  // session
  useEffect(() => {
    (async () => {
      const { data } = await supabaseBrowser.auth.getSession();
      const uid = data.session?.user?.id || null;
      setSessionUserId(uid);
      setLoading(false);
    })();
  }, []);

  const expiryMs = useMemo(() => {
    if (!expiresAt) return null;
    const d = new Date(expiresAt);
    const ms = d.getTime();
    return Number.isFinite(ms) ? ms : null;
  }, [expiresAt]);

  const remainingMs = useMemo(() => {
    if (!expiryMs) return null;
    return Math.max(0, expiryMs - nowMs);
  }, [expiryMs, nowMs]);

  const isExpired = useMemo(() => {
    if (!expiryMs) return false;
    return remainingMs === 0;
  }, [expiryMs, remainingMs]);

  async function generate(p: Provider) {
    setErr(null);
    setBusy(p);
    setProvider(p);
    setCode("");
    setExpiresAt(null);
    setLastGeneratedAt(null);

    try {
      const resp = await backendPost<CreateLinkTokenResponse>("/api/link-tokens/create", {
        provider: p,
        ttl_minutes: 30,
      });

      if (!resp || (resp as any).ok !== true) {
        const msg = (resp as any)?.error || (resp as any)?.message || "Failed to generate link code";
        throw new Error(msg);
      }

      const c = String((resp as any).code || "");
      if (!isCode(c)) throw new Error("Backend returned an invalid link code");

      setCode(c.trim().toUpperCase());
      setExpiresAt((resp as any).expires_at ?? null);
      setLastGeneratedAt(Date.now());
    } catch (e: any) {
      setErr(normalizeErrorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function copy() {
    if (!code) return;
    setErr(null);

    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // fallback
      try {
        const el = document.createElement("textarea");
        el.value = code;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      } catch {
        setErr("Unable to copy. Please copy manually.");
      }
    }
  }

  // auto-clear code display if it is expired (UX clarity)
  useEffect(() => {
    if (!code) return;
    if (isExpired) {
      // keep the code visible but show expired banner (no auto wipe)
      // (we avoid wiping to prevent user confusion)
    }
  }, [isExpired, code]);

  if (loading) {
    return (
      <div style={S.page}>
        <div style={S.container}>
          <h1 style={S.h1}>Link Channels</h1>
          <p style={{ opacity: 0.8 }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!sessionUserId) {
    return (
      <div style={S.page}>
        <div style={S.container}>
          <h1 style={S.h1}>Link Channels</h1>
          <div style={S.card}>
            <p style={{ margin: 0, fontWeight: 800 }}>You’re not logged in.</p>
            <p style={{ marginTop: 8, opacity: 0.85 }}>
              Please login, then return here to generate a secure link code.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const busyAny = busy !== null;
  const hasCode = !!code;

  return (
    <div style={S.page}>
      <div style={S.container}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={S.h1}>Link Channels</h1>
            <p style={S.sub}>
              Generate a secure 8-character code here, then send it to your bot on WhatsApp or Telegram to connect your account.
            </p>
          </div>

          <div style={S.badge}>
            Logged in ✅
          </div>
        </div>

        {/* Step 1 */}
        <div style={S.stepCard}>
          <div style={S.stepHeader}>
            <div style={S.stepNum}>1</div>
            <div>
              <div style={S.stepTitle}>Choose a channel</div>
              <div style={S.stepDesc}>Pick where you want to chat with Naija Tax Guide.</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <button
              onClick={() => generate("wa")}
              disabled={busyAny}
              style={{
                ...S.primaryBtn,
                opacity: busyAny && busy !== "wa" ? 0.55 : 1,
              }}
            >
              {busy === "wa" ? "Generating..." : "Generate WhatsApp Code"}
            </button>

            <button
              onClick={() => generate("tg")}
              disabled={busyAny}
              style={{
                ...S.secondaryBtn,
                opacity: busyAny && busy !== "tg" ? 0.55 : 1,
              }}
            >
              {busy === "tg" ? "Generating..." : "Generate Telegram Code"}
            </button>
          </div>

          <div style={{ marginTop: 10, opacity: 0.8, fontSize: 13 }}>
            Tip: If you link WhatsApp today, you can still link Telegram later (one user can have multiple channels).
          </div>
        </div>

        {/* Errors */}
        {err && (
          <div style={S.errorBox}>
            <div style={{ fontWeight: 900, color: "#ff6b6b" }}>Error</div>
            <div style={{ marginTop: 6, color: "#ffd0d0" }}>{err}</div>
          </div>
        )}

        {/* Step 2 */}
        <div style={S.stepCard}>
          <div style={S.stepHeader}>
            <div style={S.stepNum}>2</div>
            <div>
              <div style={S.stepTitle}>Your link code</div>
              <div style={S.stepDesc}>Send this code to {providerLabel(provider)} to link your account.</div>
            </div>
          </div>

          {!hasCode ? (
            <div style={{ marginTop: 12, opacity: 0.85 }}>
              Click <b>Generate</b> above to get your code.
            </div>
          ) : (
            <>
              {expiryMs && (
                <div
                  style={{
                    marginTop: 12,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: `1px solid ${isExpired ? "rgba(255,70,70,0.9)" : "#2a2a2a"}`,
                    background: isExpired ? "rgba(255,70,70,0.08)" : "rgba(255,255,255,0.02)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ fontWeight: 800 }}>
                    {isExpired ? "Expired" : "Expires in"}:{" "}
                    <span style={{ marginLeft: 6 }}>{isExpired ? "00:00" : fmtCountdown(remainingMs ?? 0)}</span>
                  </div>
                  <div style={{ opacity: 0.85, fontSize: 13 }}>
                    If expired, generate a new code.
                  </div>
                </div>
              )}

              {!expiryMs && (
                <div style={{ marginTop: 12, opacity: 0.75, fontSize: 13 }}>
                  Expiry time not provided by backend (still OK if your server enforces TTL).
                </div>
              )}

              <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={S.codeBox}>{code}</div>

                <button onClick={copy} style={S.primaryBtn}>
                  Copy
                </button>

                <div style={{ opacity: 0.75, fontSize: 13 }}>
                  Provider: <b>{providerLabel(provider)}</b>
                </div>
              </div>

              {lastGeneratedAt && (
                <div style={{ marginTop: 10, opacity: 0.75, fontSize: 13 }}>
                  Generated:{" "}
                  {new Date(lastGeneratedAt).toLocaleString()}
                </div>
              )}
            </>
          )}
        </div>

        {/* Step 3 */}
        <div style={S.stepCard}>
          <div style={S.stepHeader}>
            <div style={S.stepNum}>3</div>
            <div>
              <div style={S.stepTitle}>Complete linking on your chat app</div>
              <div style={S.stepDesc}>After linking, you can chat normally and subscription status will apply automatically.</div>
            </div>
          </div>

          <div style={S.infoBox}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>What to do next</div>
            <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
              <li>Open your <b>{providerLabel(provider)}</b>.</li>
              <li>Send the code <b>{hasCode ? code : "XXXXXXXX"}</b> to the Naija Tax Guide bot/number.</li>
              <li>You should receive: <b>“Linked successfully ✅”</b>.</li>
              <li>Now ask your tax questions normally.</li>
            </ol>

            <div style={{ marginTop: 10, opacity: 0.8, fontSize: 13 }}>
              Security note: codes are short-lived and can’t be reused after expiry.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { padding: 24, color: "#fff" },
  container: { maxWidth: 920, margin: "0 auto" },

  h1: { fontSize: 30, fontWeight: 950, margin: 0 },
  sub: { marginTop: 10, opacity: 0.85, maxWidth: 760 },

  badge: {
    border: "1px solid #2a2a2a",
    padding: "8px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    background: "rgba(255,255,255,0.03)",
    color: "#ddd",
  },

  stepCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    border: "1px solid #2a2a2a",
    background: "rgba(255,255,255,0.03)",
  },

  stepHeader: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
  },

  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 10,
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
    border: "1px solid #333",
    background: "rgba(255,255,255,0.04)",
  },

  stepTitle: { fontSize: 16, fontWeight: 950 },
  stepDesc: { marginTop: 4, opacity: 0.8, fontSize: 13 },

  primaryBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #333",
    cursor: "pointer",
    fontWeight: 900,
    background: "#000",
    color: "#fff",
  },

  secondaryBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #333",
    cursor: "pointer",
    fontWeight: 900,
    background: "rgba(255,255,255,0.02)",
    color: "#fff",
  },

  codeBox: {
    fontSize: 34,
    letterSpacing: 6,
    fontWeight: 950,
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px dashed #777",
    background: "rgba(0,0,0,0.35)",
  },

  errorBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    border: "1px solid rgba(255,70,70,0.9)",
    background: "rgba(255,70,70,0.08)",
  },

  infoBox: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    border: "1px solid #333",
    background: "rgba(0,0,0,0.25)",
  },
};
