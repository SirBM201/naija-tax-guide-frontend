"use client";

import React, { useEffect, useState } from "react";
import { apiJson, isApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import SubscriptionRequiredCard from "@/components/SubscriptionRequiredCard";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type AskResp = {
  ok?: boolean;
  answer?: string;
  from_cache?: boolean;
  account_id?: string;
  error?: string;
  root_cause?: string;
  fix?: string;
  details?: any;
  debug?: any;
  subscription?: any;
};

export default function ChatPage() {
  const { refreshSession } = useAuth();

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Start a tax conversation.");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [raw, setRaw] = useState<any>(null);

  const [subscriptionBlocked, setSubscriptionBlocked] = useState(false);
  const [subscriptionReason, setSubscriptionReason] = useState<string | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);

  useEffect(() => {
    refreshSession().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = async () => {
    const q = input.trim();
    if (!q) return;

    setBusy(true);
    setStatus("Sending...");
    setRaw(null);
    setSubscriptionBlocked(false);
    setSubscriptionReason(null);
    setSubscriptionDetails(null);

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: q }];
    setMessages(nextMessages);
    setInput("");

    try {
      const data = await apiJson<AskResp>("/ask", {
        method: "POST",
        timeoutMs: 45000,
        useAuthToken: false,
        body: {
          question: q,
          lang: "en",
          channel: "web_chat",
        },
      });

      setRaw(data);

      if (data?.ok) {
        setMessages([...nextMessages, { role: "assistant", content: data?.answer || "" }]);
        setStatus("Reply received.");
        return;
      }

      setStatus(`Chat failed (${data?.error || "unknown_error"})`);
    } catch (err: any) {
      if (isApiError(err)) {
        setRaw(err.data ?? null);

        if (err.status === 402) {
          setSubscriptionBlocked(true);
          setSubscriptionReason(
            err?.data?.root_cause ||
              err?.data?.details?.access?.reason ||
              "subscription_required"
          );
          setSubscriptionDetails(err?.data ?? null);
          setStatus("Subscription required.");
          return;
        }

        if (err.status === 401) {
          setStatus("Unauthorized. Please login again.");
          return;
        }

        setStatus(`Chat failed (${err.status})`);
      } else {
        setStatus("Chat failed");
        setRaw(String(err?.message || err));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        background:
          "radial-gradient(900px 700px at 20% 10%, rgba(120,140,255,0.22), transparent 60%), rgba(7,10,18,1)",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ fontSize: 42, fontWeight: 950, color: "white", letterSpacing: -1 }}>Chat</div>
        <div style={{ marginTop: 8, color: "rgba(255,255,255,0.70)" }}>{status}</div>

        <div
          style={{
            marginTop: 22,
            borderRadius: 22,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.04)",
            padding: 22,
          }}
        >
          <div style={{ display: "grid", gap: 14 }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: m.role === "user" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.22)",
                  color: "white",
                }}
              >
                <div style={{ fontWeight: 900, marginBottom: 8, opacity: 0.8 }}>
                  {m.role === "user" ? "You" : "AI"}
                </div>
                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{m.content}</div>
              </div>
            ))}
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            rows={4}
            style={{
              width: "100%",
              resize: "vertical",
              marginTop: 16,
              padding: 16,
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
              color: "white",
              outline: "none",
              fontSize: 15,
            }}
          />

          <button
            onClick={send}
            disabled={busy}
            style={{
              marginTop: 14,
              padding: "14px 18px",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.08)",
              color: "white",
              fontWeight: 900,
              cursor: busy ? "not-allowed" : "pointer",
            }}
          >
            {busy ? "Sending..." : "Send"}
          </button>
        </div>

        <div style={{ marginTop: 22 }}>
          {subscriptionBlocked ? (
            <SubscriptionRequiredCard
              reason={subscriptionReason}
              details={subscriptionDetails}
              message="Your current subscription does not allow Chat access. Upgrade or reactivate billing to continue."
            />
          ) : null}
        </div>

        <div
          style={{
            marginTop: 22,
            borderRadius: 22,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.04)",
            padding: 22,
          }}
        >
          <div style={{ color: "white", fontWeight: 900, marginBottom: 10 }}>Raw response (debug)</div>
          <pre
            style={{
              margin: 0,
              padding: 16,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.22)",
              color: "rgba(255,255,255,0.86)",
              whiteSpace: "pre-wrap",
              fontFamily: "ui-monospace, Menlo, monospace",
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            {JSON.stringify(raw, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}