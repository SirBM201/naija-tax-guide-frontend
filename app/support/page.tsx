"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell, { shellButtonPrimary, shellButtonSecondary } from "@/components/app-shell";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { Banner, appInputStyle, appSelectStyle, appTextareaStyle, formatDate } from "@/components/ui";
import { SectionStack } from "@/components/page-layout";

type SupportTicket = {
  id?: number;
  ticket_id: string;
  status?: string;
  category?: string;
  priority?: string;
  subject?: string;
  message?: string;
  created_at?: string;
  updated_at?: string;
  last_message_preview?: string | null;
};

type SupportMessage = {
  id?: number;
  ticket_id?: string;
  sender_type?: "user" | "admin";
  sender_name?: string | null;
  message?: string;
  created_at?: string;
};

type FormState = {
  category: string;
  priority: string;
  subject: string;
  message: string;
};

function apiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return cleanPath.startsWith("/api/") ? cleanPath : `/api${cleanPath}`;
}

function text(value: unknown, fallback = "Not shown"): string {
  const raw = value == null ? "" : String(value).trim();
  return raw || fallback;
}

function panelStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 16,
    background: "var(--surface)",
    padding: "clamp(12px, 3vw, 16px)",
    display: "grid",
    gap: 10,
    minWidth: 0,
  };
}

function rowStyle(active: boolean): React.CSSProperties {
  return {
    ...panelStyle(),
    cursor: "pointer",
    background: active ? "rgba(78, 110, 255, 0.14)" : "var(--surface)",
  };
}

function wrapStyle(): React.CSSProperties {
  return {
    minWidth: 0,
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  };
}

function actionGrid(): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
    gap: 12,
  };
}

export default function SupportPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [replyMessage, setReplyMessage] = useState("");
  const [form, setForm] = useState<FormState>({
    category: "general",
    priority: "normal",
    subject: "",
    message: "",
  });
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replying, setReplying] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setNotice("");
    setError("");
  }

  async function loadTicketDetail(ticketId: string) {
    if (!ticketId) return;
    setLoadingThread(true);
    try {
      const response = await fetch(apiUrl(`/support/tickets/${encodeURIComponent(ticketId)}`), {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || data?.error || `Could not load ticket. Status: ${response.status}`);
      }
      setSelectedTicket((data.ticket || null) as SupportTicket | null);
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setSelectedTicketId(ticketId);
      setError("");
    } catch (err: any) {
      setError(err?.message || "Could not load support ticket.");
    } finally {
      setLoadingThread(false);
    }
  }

  async function loadTickets(selectFirst = false) {
    setLoadingTickets(true);
    try {
      const response = await fetch(apiUrl("/support/tickets?limit=50"), {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || data?.error || `Could not load support tickets. Status: ${response.status}`);
      }
      const rows = Array.isArray(data.tickets) ? (data.tickets as SupportTicket[]) : [];
      setTickets(rows);
      if (rows.length === 0) {
        setSelectedTicketId("");
        setSelectedTicket(null);
        setMessages([]);
        return;
      }
      const stillExists = selectedTicketId && rows.some((ticket) => ticket.ticket_id === selectedTicketId);
      if (selectFirst || !stillExists) {
        await loadTicketDetail(rows[0].ticket_id);
      }
      setError("");
    } catch (err: any) {
      setError(err?.message || "Could not load support tickets.");
    } finally {
      setLoadingTickets(false);
    }
  }

  useEffect(() => {
    void loadTickets(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitSupport() {
    if (!form.subject.trim() || !form.message.trim()) {
      setError("Please provide a subject and message.");
      setNotice("");
      return;
    }
    if (form.message.trim().length < 10) {
      setError("Support message must be at least 10 characters.");
      setNotice("");
      return;
    }

    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(apiUrl("/support"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueType: form.category,
          priority: form.priority,
          channel: "web",
          subject: form.subject.trim(),
          message: form.message.trim(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || data?.error || `Support request failed. Status: ${response.status}`);
      }
      const ticketId = data?.ticket?.ticket_id || data?.ticket_id || "not shown";
      setNotice(`Support request created. Ticket ID: ${ticketId}.`);
      setForm({ category: "general", priority: "normal", subject: "", message: "" });
      await loadTickets(true);
      if (ticketId && ticketId !== "not shown") {
        await loadTicketDetail(ticketId);
      }
    } catch (err: any) {
      setError(err?.message || "Support request could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitReply() {
    if (!selectedTicketId) {
      setError("Select a ticket before replying.");
      return;
    }
    if (!replyMessage.trim()) {
      setError("Please write a reply first.");
      return;
    }

    setReplying(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(apiUrl(`/support/tickets/${encodeURIComponent(selectedTicketId)}/reply`), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyMessage.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || data?.error || `Reply failed. Status: ${response.status}`);
      }
      setNotice(`Reply sent for ticket ${selectedTicketId}.`);
      setReplyMessage("");
      await loadTickets(false);
      await loadTicketDetail(selectedTicketId);
    } catch (err: any) {
      setError(err?.message || "Reply could not be submitted.");
    } finally {
      setReplying(false);
    }
  }

  return (
    <AppShell
      title="Support"
      subtitle="Submit and track support requests from one inbox."
      actions={
        <>
          <button type="button" onClick={() => router.push("/help")} style={shellButtonSecondary()}>
            Help
          </button>
          <button type="button" onClick={() => router.push("/dashboard")} style={shellButtonPrimary()}>
            Dashboard
          </button>
        </>
      }
    >
      <SectionStack>
        {notice ? <Banner tone="good" title="Support update" subtitle={notice} /> : null}
        {error ? <Banner tone="danger" title="Support issue" subtitle={error} /> : null}

        <WorkspaceSectionCard title="My support requests" subtitle="All support and professional review tickets are shown here.">
          <div style={actionGrid()}>
            <button type="button" onClick={() => loadTickets(true)} style={shellButtonPrimary()}>
              {loadingTickets ? "Refreshing..." : "Refresh Tickets"}
            </button>
            <button type="button" onClick={() => router.push("/expert-review")} style={shellButtonSecondary()}>
              Professional Review
            </button>
          </div>

          {loadingTickets ? (
            <Banner tone="default" title="Loading tickets" subtitle="Please wait..." />
          ) : tickets.length === 0 ? (
            <Banner tone="default" title="No support requests yet" subtitle="Your submitted tickets will appear here." />
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {tickets.map((ticket) => {
                const active = ticket.ticket_id === selectedTicketId;
                return (
                  <button
                    key={ticket.ticket_id}
                    type="button"
                    onClick={() => loadTicketDetail(ticket.ticket_id)}
                    style={{ ...rowStyle(active), textAlign: "left" }}
                  >
                    <strong style={{ color: "var(--text)", fontSize: 16, ...wrapStyle() }}>
                      {text(ticket.ticket_id)} - {text(ticket.subject, "Support request")}
                    </strong>
                    <div style={{ color: "var(--text-muted)", lineHeight: 1.7, ...wrapStyle() }}>
                      Status: {text(ticket.status, "open")} | Priority: {text(ticket.priority, "normal")} | Type: {text(ticket.category, "general")}
                    </div>
                    <div style={{ color: "var(--text-muted)", lineHeight: 1.7, ...wrapStyle() }}>
                      Updated: {ticket.updated_at ? formatDate(ticket.updated_at) : "Not shown"}
                    </div>
                    <div style={{ color: "var(--text-muted)", lineHeight: 1.7, ...wrapStyle() }}>
                      {text(ticket.last_message_preview || ticket.message, "No message preview available.")}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </WorkspaceSectionCard>

        <WorkspaceSectionCard title="Ticket conversation" subtitle="Open a ticket above to view and reply.">
          {!selectedTicketId ? (
            <Banner tone="default" title="No ticket selected" subtitle="Select a ticket to view the thread." />
          ) : loadingThread ? (
            <Banner tone="default" title="Loading thread" subtitle="Please wait..." />
          ) : selectedTicket ? (
            <div style={{ display: "grid", gap: 14 }}>
              <div style={panelStyle()}>
                <strong style={{ color: "var(--text)", fontSize: 18, ...wrapStyle() }}>
                  {text(selectedTicket.ticket_id)} - {text(selectedTicket.subject, "Support request")}
                </strong>
                <div style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>
                  Status: {text(selectedTicket.status, "open")} | Priority: {text(selectedTicket.priority, "normal")}
                </div>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {messages.length === 0 ? (
                  <Banner tone="default" title="No messages yet" subtitle="The original request or future replies will appear here." />
                ) : (
                  messages.map((msg, index) => (
                    <div key={`${msg.id || index}-${msg.created_at || "message"}`} style={panelStyle()}>
                      <strong style={{ color: "var(--text)" }}>
                        {msg.sender_type === "admin" ? msg.sender_name || "Support Team" : msg.sender_name || "You"}
                      </strong>
                      <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                        {msg.created_at ? formatDate(msg.created_at) : "Not shown"}
                      </div>
                      <div style={{ color: "var(--text)", lineHeight: 1.8, whiteSpace: "pre-wrap", ...wrapStyle() }}>
                        {text(msg.message, "")}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <textarea
                value={replyMessage}
                onChange={(event) => setReplyMessage(event.target.value)}
                placeholder="Write your reply to support here..."
                rows={5}
                style={appTextareaStyle()}
              />
              <div style={actionGrid()}>
                <button type="button" onClick={submitReply} disabled={replying} style={shellButtonPrimary()}>
                  {replying ? "Sending..." : "Send Reply"}
                </button>
                <button type="button" onClick={() => setReplyMessage("")} style={shellButtonSecondary()}>
                  Clear Reply
                </button>
              </div>
            </div>
          ) : (
            <Banner tone="default" title="Ticket not available" subtitle="Select another ticket or refresh the list." />
          )}
        </WorkspaceSectionCard>

        <WorkspaceSectionCard title="Open a new support request" subtitle="Use this for billing, credits, channels, login, or technical issues.">
          <div style={{ display: "grid", gap: 12 }}>
            <select value={form.category} onChange={(event) => setField("category", event.target.value)} style={appSelectStyle()}>
              <option value="general">Issue type: General support</option>
              <option value="billing">Issue type: Billing or subscription</option>
              <option value="credits">Issue type: Credits or access</option>
              <option value="channels">Issue type: WhatsApp or Telegram linking</option>
              <option value="login">Issue type: Login or authentication</option>
              <option value="technical">Issue type: Technical issue</option>
            </select>
            <select value={form.priority} onChange={(event) => setField("priority", event.target.value)} style={appSelectStyle()}>
              <option value="normal">Priority: Normal</option>
              <option value="high">Priority: High</option>
              <option value="urgent">Priority: Urgent</option>
            </select>
            <input value={form.subject} onChange={(event) => setField("subject", event.target.value)} placeholder="Support subject" style={appInputStyle()} />
            <textarea value={form.message} onChange={(event) => setField("message", event.target.value)} placeholder="Describe the issue clearly." rows={7} style={appTextareaStyle()} />
            <button type="button" onClick={submitSupport} disabled={submitting} style={shellButtonPrimary()}>
              {submitting ? "Submitting..." : "Submit Support Request"}
            </button>
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
