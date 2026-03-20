"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CONFIG } from "@/lib/config";

type Lang = "en" | "pcm" | "yo" | "ig" | "ha";

type AskOk = {
  ok: true;
  answer: string;
  audio_url: string | null;
  mode?: "text" | "voice";
  used_cache?: boolean;
  ai_hit?: boolean;
  cost?: number;
  credits_remaining?: number | null;
  plan_expiry?: string | null;
  daily_used?: number;
  daily_limit?: number;
};

type AskBlocked = {
  ok: false;
  reason?: string;
  message?: string;
  plan_expiry?: string | null;
  daily_used?: number;
  daily_limit?: number;
  credits_remaining?: number | null;
};

type AskResponse = AskOk | AskBlocked;

type ChatMsg = {
  id: string;
  role: "user" | "bot";
  text: string;
  ts: number;
};

function safeUUID(): string {
  // Browser only
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreateWebUid(): string {
  const key = "ntg:web_uid";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const v = safeUUID();
  localStorage.setItem(key, v);
  return v;
}

function fmtExpiry(value?: string | null): string {
  if (!value) return "Not subscribed / unknown";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function loadHistory(uid: string): ChatMsg[] {
  try {
    const raw = localStorage.getItem(`ntg:chat:${uid}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(Boolean);
  } catch {
    return [];
  }
}

function saveHistory(uid: string, msgs: ChatMsg[]) {
  try {
    localStorage.setItem(`ntg:chat:${uid}`, JSON.stringify(msgs.slice(-200)));
  } catch {}
}

async function postJSON<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {}

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error || data.details)) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

export default function WebChat() {
  const [webUid, setWebUid] = useState<string>("");
  const [lang, setLang] = useState<Lang>("en");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [busy, setBusy] = useState(false);

  const [planExpiry, setPlanExpiry] = useState<string | null>(null);
  const [dailyUsed, setDailyUsed] = useState<number | null>(null);
  const [dailyLimit, setDailyLimit] = useState<number | null>(null);

  const [blocked, setBlocked] = useState<AskBlocked | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const apiBase = CONFIG.apiBase.replace(/\/$/, "");
  const canSend = useMemo(() => !busy && input.trim().length > 0, [busy, input]);

  // init identity + history
  useEffect(() => {
    const uid = getOrCreateWebUid();
    setWebUid(uid);
    const hist = loadHistory(uid);
    setMessages(hist);

    // try load last known plan expiry snapshot (optional)
    const pe = localStorage.getItem("ntg:last_plan_expiry");
    if (pe) setPlanExpiry(pe);
  }, []);

  // persist history
  useEffect(() => {
    if (!webUid) return;
    saveHistory(webUid, messages);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, webUid]);

  // best-effort: ensure accounts row exists
  async function upsertWebAccount(uid: string) {
    try {
      await postJSON(`${apiBase}/accounts`, {
        provider: "web",
        provider_user_id: uid,
        display_name: "Web User",
      });
    } catch {
      // best effort only
    }
  }

  async function send() {
    const q = input.trim();
    if (!q || !webUid || busy) return;

    setBlocked(null);
    setBusy(true);

    const userMsg: ChatMsg = { id: safeUUID(), role: "user", text: q, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // 1) upsert account best-effort
    await upsertWebAccount(webUid);

    // 2) ask
    try {
      const resp = await postJSON<AskResponse>(`${apiBase}/ask`, {
        provider: "web",
        provider_user_id: webUid,
        question: q,
        lang,
        mode: "text",
      });

      if (resp.ok) {
        const ok = resp as AskOk;

        if (ok.plan_expiry !== undefined) {
          setPlanExpiry(ok.plan_expiry ?? null);
          if (ok.plan_expiry) localStorage.setItem("ntg:last_plan_expiry", ok.plan_expiry);
        }
        if (typeof ok.daily_used === "number") setDailyUsed(ok.daily_used);
        if (typeof ok.daily_limit === "number") setDailyLimit(ok.daily_limit);

        const botMsg: ChatMsg = {
          id: safeUUID(),
          role: "bot",
          text: ok.answer || "(No answer returned)",
          ts: Date.now(),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const bad = resp as AskBlocked;

        if (bad.plan_expiry !== undefined) {
          setPlanExpiry(bad.plan_expiry ?? null);
          if (bad.plan_expiry) localStorage.setItem("ntg:last_plan_expiry", bad.plan_expiry);
        }
        if (typeof bad.daily_used === "number") setDailyUsed(bad.daily_used);
        if (typeof bad.daily_limit === "number") setDailyLimit(bad.daily_limit);

        setBlocked(bad);

        const botMsg: ChatMsg = {
          id: safeUUID(),
          role: "bot",
          text: bad.message || "Request blocked.",
          ts: Date.now(),
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (e: any) {
      const botMsg: ChatMsg = {
        id: safeUUID(),
        role: "bot",
        text: `Error: ${e?.message || "Request failed."}`,
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setBusy(false);
    }
  }

  function clearChat() {
    if (!webUid) return;
    setMessages([]);
    setBlocked(null);
    setDailyUsed(null);
    setDailyLimit(null);
    try {
      localStorage.removeItem(`ntg:chat:${webUid}`);
    } catch {}
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) void send();
    }
  }

  const badgeStyle: React.CSSProperties = {
    border: "1px solid #232323",
    background: "rgba(255,255,255,0.03)",
    padding: "8px 10px",
    borderRadius: 12,
    color: "#ddd",
    fontSize: 13,
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
      {/* Top info bar */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={badgeStyle}>
            <b>Plan Expiry:</b> {fmtExpiry(planExpiry)}
          </div>

          {dailyLimit !== null && (
            <div style={badgeStyle}>
              <b>Daily:</b> {dailyUsed ?? 0}/{dailyLimit}
            </div>
          )}

          <div style={badgeStyle}>
            <b>Web UID:</b> {webUid ? webUid.slice(0, 8) + "…" : "…"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            style={{
              ...badgeStyle,
              cursor: "pointer",
              color: "#fff",
              background: "rgba(255,255,255,0.04)",
            }}
            aria-label="Language"
          >
            <option value="en">English</option>
            <option value="pcm">Pidgin</option>
            <option value="yo">Yoruba</option>
            <option value="ig">Igbo</option>
            <option value="ha">Hausa</option>
          </select>

          <button
            onClick={clearChat}
            style={{
              border: "1px solid #2a2a2a",
              background: "rgba(255,255,255,0.03)",
              color: "#fff",
              padding: "8px 12px",
              borderRadius: 12,
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* If blocked, show CTA */}
      {blocked && (
        <div
          style={{
            border: "1px solid #3a2a2a",
            background: "rgba(255,0,0,0.06)",
            padding: 14,
            borderRadius: 14,
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Access blocked</div>
          <div style={{ color: "#ddd" }}>{blocked.message || "Subscription required."}</div>
          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              href="/pricing"
              style={{
                display: "inline-block",
                border: "1px solid #2a2a2a",
                background: "rgba(255,255,255,0.06)",
                padding: "10px 12px",
                borderRadius: 12,
                color: "#fff",
                textDecoration: "none",
                fontWeight: 900,
              }}
            >
              Go to Pricing
            </Link>
            <Link
              href="/support"
              style={{
                display: "inline-block",
                border: "1px solid #2a2a2a",
                background: "rgba(255,255,255,0.03)",
                padding: "10px 12px",
                borderRadius: 12,
                color: "#fff",
                textDecoration: "none",
                fontWeight: 900,
              }}
            >
              Contact Support
            </Link>
          </div>
        </div>
      )}

      {/* Chat box */}
      <div
        style={{
          border: "1px solid #222",
          borderRadius: 16,
          background: "rgba(255,255,255,0.02)",
          minHeight: 520,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 14, borderBottom: "1px solid #222", color: "#aaa", fontSize: 13 }}>
          Web Chat connects to <b>{apiBase}</b> → <code style={{ color: "#ddd" }}>/ask</code>
        </div>

        <div style={{ padding: 14, flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          {messages.length === 0 && (
            <div style={{ color: "#aaa", lineHeight: 1.6 }}>
              Ask Nigerian tax questions here. Your message goes to the same backend guard logic as WhatsApp/Telegram.
              <br />
              <br />
              Tip: Press <b>Enter</b> to send, <b>Shift+Enter</b> for a new line.
            </div>
          )}

          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                style={{
                  alignSelf: isUser ? "flex-end" : "flex-start",
                  maxWidth: "86%",
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: "1px solid #222",
                  background: isUser ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.55,
                }}
              >
                <div style={{ fontSize: 12, color: "#aaa", marginBottom: 6, fontWeight: 800 }}>
                  {isUser ? "You" : "Naija Tax AI"} • {new Date(m.ts).toLocaleTimeString()}
                </div>
                <div style={{ color: "#fff" }}>{m.text}</div>
              </div>
            );
          })}

          {busy && (
            <div style={{ color: "#aaa", fontStyle: "italic" }}>
              Thinking…
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: 14, borderTop: "1px solid #222", display: "grid", gap: 10 }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type your tax question…"
            rows={3}
            style={{
              width: "100%",
              resize: "none",
              borderRadius: 14,
              border: "1px solid #2a2a2a",
              background: "rgba(0,0,0,0.35)",
              color: "#fff",
              padding: 12,
              outline: "none",
            }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ color: "#aaa", fontSize: 12 }}>
              Language: <b style={{ color: "#ddd" }}>{lang}</b>
            </div>

            <button
              onClick={() => void send()}
              disabled={!canSend}
              style={{
                border: "1px solid #2a2a2a",
                background: canSend ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                color: "#fff",
                padding: "10px 14px",
                borderRadius: 14,
                cursor: canSend ? "pointer" : "not-allowed",
                fontWeight: 900,
                minWidth: 120,
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
