"use client";

import React, { useMemo, useState } from "react";
import PortalShell from "@/components/PortalShell";
import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth";

type Msg = { role: "user" | "assistant"; text: string; ts: number };

function panelStyle(): React.CSSProperties {
  return {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    padding: 16,
    minWidth: 0,
  };
}

function infoCardStyle(): React.CSSProperties {
  return {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    padding: 16,
    minWidth: 0,
    height: "100%",
  };
}

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
        <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            <div style={infoCardStyle()}>
              <div style={{ fontSize: 12, opacity: 0.72, fontWeight: 800 }}>
                Mode
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: "clamp(18px, 4vw, 22px)",
                  fontWeight: 900,
                  lineHeight: 1.15,
                  wordBreak: "break-word",
                }}
              >
                {bypassEnabled ? "Bypass Preview" : "Authenticated Preview"}
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontSize: 14,
                  opacity: 0.8,
                  lineHeight: 1.65,
                }}
              >
                This chat page is currently a UI placeholder so the workflow can be tested before the real engine is connected.
              </div>
            </div>

            <div style={infoCardStyle()}>
              <div style={{ fontSize: 12, opacity: 0.72, fontWeight: 800 }}>
                Current thread
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: "clamp(18px, 4vw, 22px)",
                  fontWeight: 900,
                  lineHeight: 1.15,
                }}
              >
                {msgs.length} message{msgs.length === 1 ? "" : "s"}
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontSize: 14,
                  opacity: 0.8,
                  lineHeight: 1.65,
                }}
              >
                Designed for phone-safe scrolling, message wrapping, and narrow-screen composition.
              </div>
            </div>
          </div>

          <div style={panelStyle()}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 12,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, opacity: 0.72, fontWeight: 800 }}>
                  Conversation
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: "clamp(18px, 4vw, 22px)",
                    fontWeight: 900,
                    lineHeight: 1.15,
                    wordBreak: "break-word",
                  }}
                >
                  Tax Assistant Thread
                </div>
              </div>

              <div
                style={{
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.05)",
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: 800,
                  opacity: 0.9,
                  maxWidth: "100%",
                  wordBreak: "break-word",
                }}
              >
                Mobile-safe preview
              </div>
            </div>

            <div
              style={{
                height: "min(62vh, 620px)",
                minHeight: 320,
                overflow: "auto",
                padding: 12,
                borderRadius: 16,
                background: "rgba(0,0,0,0.20)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ display: "grid", gap: 10 }}>
                {msgs.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: "fit-content",
                        maxWidth: "min(88%, 560px)",
                        padding: "10px 12px",
                        borderRadius: 14,
                        background:
                          m.role === "user"
                            ? "rgba(0,200,255,0.14)"
                            : "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        wordBreak: "break-word",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          opacity: 0.82,
                          fontWeight: 800,
                          lineHeight: 1.3,
                        }}
                      >
                        {m.role === "user" ? "You" : "Assistant"}
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.65,
                          fontSize: 14,
                          wordBreak: "break-word",
                        }}
                      >
                        {m.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                marginTop: 14,
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr)",
                gap: 10,
                minWidth: 0,
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                style={{
                  width: "100%",
                  minWidth: 0,
                  padding: "14px 15px",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "white",
                  outline: "none",
                  fontSize: 16,
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
              />

              <button
                onClick={send}
                disabled={!canSend}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 14,
                  background: "rgba(0,200,255,0.12)",
                  border: "1px solid rgba(0,200,255,0.25)",
                  color: "white",
                  fontWeight: 900,
                  cursor: canSend ? "pointer" : "not-allowed",
                  opacity: canSend ? 1 : 0.6,
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </PortalShell>
    </RequireAuth>
  );
}
