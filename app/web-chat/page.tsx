"use client";

import React, { useMemo, useState } from "react";
import PortalShell from "@/components/PortalShell";
import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth";

type Msg = { role: "user" | "assistant"; text: string; ts: number };

export default function WebChatPage() {
  const { bypassEnabled } = useAuth();
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      text:
        "Welcome to Tax Assistant Chat. In bypass mode, this is UI-only so you can continue design. We’ll wire backend later.",
      ts: Date.now(),
    },
  ]);

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  const send = () => {
    if (!canSend) return;

    const userMsg: Msg = { role: "user", text: input.trim(), ts: Date.now() };
    setMsgs((m) => [...m, userMsg]);
    setInput("");

    // UI-only assistant reply for now
    const reply: Msg = {
      role: "assistant",
      text: bypassEnabled
        ? "BYPASS mode reply (UI-only). We will connect the real chat engine later."
        : "Authenticated reply placeholder.",
      ts: Date.now() + 1,
    };
    setMsgs((m) => [...m, reply]);
  };

  return (
    <RequireAuth>
      <PortalShell
        title="Tax Assistant Chat"
        subtitle="Conversation thread (WhatsApp-like). Best for back-and-forth clarification."
      >
        <div
          style={{
            height: "62vh",
            overflow: "auto",
            padding: 12,
            borderRadius: 16,
            background: "rgba(0,0,0,0.20)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {msgs.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  maxWidth: "75%",
                  padding: "10px 12px",
                  borderRadius: 14,
                  background:
                    m.role === "user"
                      ? "rgba(0,200,255,0.14)"
                      : "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 800 }}>
                  {m.role === "user" ? "You" : "Assistant"}
                </div>
                <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{m.text}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: 14,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "white",
              outline: "none",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
          />
          <button
            onClick={send}
            disabled={!canSend}
            style={{
              padding: "12px 16px",
              borderRadius: 14,
              background: "rgba(0,200,255,0.12)",
              border: "1px solid rgba(0,200,255,0.25)",
              color: "white",
              fontWeight: 900,
              cursor: "pointer",
              opacity: canSend ? 1 : 0.6,
            }}
          >
            Send
          </button>
        </div>
      </PortalShell>
    </RequireAuth>
  );
}
