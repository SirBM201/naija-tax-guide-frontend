"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import AppShell, {
  shellButtonPrimary,
  shellButtonSecondary,
} from "@/components/app-shell";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import {
  Banner,
  MetricCard,
  appInputStyle,
  appSelectStyle,
  appTextareaStyle,
  formatDate,
} from "@/components/ui";
import { CardsGrid, SectionStack } from "@/components/page-layout";
import { useWorkspaceState } from "@/hooks/useWorkspaceState";
import { buildWorkspaceAlerts } from "@/lib/workspace-alerts";

type SupportFormState = {
  category: string;
  priority: string;
  subject: string;
  message: string;
};

type SupportTicket = {
  id?: number;
  ticket_id: string;
  status: string;
  category: string;
  priority: string;
  subject: string;
  message?: string;
  created_at?: string;
  updated_at?: string;
  last_reply_at?: string | null;
  last_reply_by?: string | null;
  last_message_preview?: string | null;
};

type SupportMessage = {
  id: number;
  support_ticket_id: number;
  ticket_id: string;
  account_id: string;
  sender_type: "user" | "admin";
  sender_name?: string | null;
  message: string;
  is_internal_note?: boolean;
  created_at?: string;
};

function safeText(value: unknown, fallback = "—"): string {
  const text =
    typeof value === "string"
      ? value.trim()
      : value == null
      ? ""
      : String(value).trim();
  return text || fallback;
}

function truthyValue(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const raw = value.trim().toLowerCase();
    return ["1", "true", "yes", "active", "paid", "enabled", "linked"].includes(raw);
  }
  return false;
}

function infoBoxStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 18,
    background: "var(--surface)",
    padding: 16,
    display: "grid",
    gap: 6,
  };
}

function pageGridStyle(): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.05fr) minmax(360px, 0.95fr)",
    gap: 18,
    alignItems: "start",
  };
}

function ticketRowStyle(active: boolean): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 16,
    background: active ? "rgba(78, 110, 255, 0.14)" : "var(--surface)",
    padding: 14,
    display: "grid",
    gap: 6,
    cursor: "pointer",
  };
}

function messageBubbleStyle(senderType: "user" | "admin"): React.CSSProperties {
  const isUser = senderType === "user";
  return {
    maxWidth: "88%",
    justifySelf: isUser ? "end" : "start",
    border: "1px solid var(--border)",
    borderRadius: 16,
    background: isUser ? "rgba(78, 110, 255, 0.16)" : "var(--surface)",
    padding: 14,
    display: "grid",
    gap: 6,
  };
}

function statusTone(status: string): "default" | "good" | "warn" | "danger" {
  const s = (status || "").toLowerCase();
  if (s === "resolved") return "good";
  if (s === "awaiting_user") return "warn";
  if (s === "in_review") return "default";
  return "warn";
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  "https://incredible-nonie-bmsconcept-37359733.koyeb.app";

function apiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}

export default function SupportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAuth();

  const { profile, usage, subscription, channelLinks, billing, credits } =
    useWorkspaceState();

  const alerts = useMemo(
    () =>
      buildWorkspaceAlerts({
        profile,
        usage,
        subscription,
        channelLinks,
        billing,
        credits,
      }),
    [profile, usage, subscription, channelLinks, billing, credits]
  );

  const primaryAlert =
    alerts.find(
      (alert) =>
        /billing|subscription|credit|channel|support|login/i.test(alert.title) ||
        /billing|subscription|credit|channel|support|login/i.test(alert.subtitle)
    ) || null;

  const accountEmail = safeText(
    profile?.email || user?.email || billing?.checkout_email || "Not visible"
  );
  const accountName = safeText(
    profile?.full_name || profile?.first_name || user?.email || "Workspace user"
  );
  const planName = safeText(
    subscription?.plan_name ||
      billing?.plan_name ||
      subscription?.plan_code ||
      billing?.plan_code ||
      "No active plan"
  );
  const planStatus = safeText(subscription?.status || billing?.status || "Unknown");
  const activeNow = truthyValue(
    subscription?.active ||
      billing?.active ||
      planStatus.toLowerCase() === "active"
  );

  const billingView = (billing ?? {}) as Record<string, unknown>;
  const latestPaymentReference = safeText(
    billingView["payment_reference"] || billingView["last_payment_reference"] || "Not visible"
  );
  const latestPaymentDate = safeText(
    billingView["payment_date"] ||
      billingView["last_payment_date"] ||
      billingView["paid_at"] ||
      "Not visible"
  );
  const expiresAt = safeText(
    billingView["expires_at"] ||
      billingView["expiry_date"] ||
      subscription?.expires_at ||
      "Not visible"
  );

  const creditBalance = Number(credits?.balance ?? 0);

  const whatsappLinked = truthyValue(
    channelLinks?.whatsapp_linked || channelLinks?.whatsapp?.linked
  );
  const telegramLinked = truthyValue(
    channelLinks?.telegram_linked || channelLinks?.telegram?.linked
  );

  const channelState =
    whatsappLinked && telegramLinked
      ? "WhatsApp + Telegram linked"
      : whatsappLinked
      ? "WhatsApp linked"
      : telegramLinked
      ? "Telegram linked"
      : "No linked channel";

  const [form, setForm] = useState<SupportFormState>({
    category: "general",
    priority: "normal",
    subject: "",
    message: "",
  });

  const [replyMessage, setReplyMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replying, setReplying] = useState(false);

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string>("");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [threadMessages, setThreadMessages] = useState<SupportMessage[]>([]);

  const supportIntent = searchParams.get("intent") || "";

  const intentPreset = useMemo(() => {
    const intent = supportIntent.trim().toLowerCase();

    const contextLines = [
      `Current plan: ${planName}`,
      `Plan status: ${planStatus}`,
      `Latest payment reference: ${latestPaymentReference}`,
      `Latest payment date: ${latestPaymentDate}`,
      `Visible credits: ${creditBalance}`,
      `Channel state: ${channelState}`,
      `Subscription expiry: ${expiresAt}`,
    ];

    if (intent === "duplicate_charge") {
      return {
        category: "billing",
        priority: "high",
        subject: "Duplicate charge review request",
        message:
          "I want to report a possible duplicate charge. Please review whether more than one payment was captured for the same intended purchase.\n\n" +
          contextLines.join("\n"),
      };
    }

    if (intent === "wrong_plan") {
      return {
        category: "billing",
        priority: "high",
        subject: "Wrong plan activated after payment",
        message:
          "Payment appears successful, but the visible plan does not match what I intended to buy. Please review the activation result against the payment record.\n\n" +
          contextLines.join("\n"),
      };
    }

    if (intent === "activation_issue") {
      return {
        category: "credits",
        priority: "high",
        subject: "Payment successful but activation or access failed",
        message:
          "Payment appears successful, but activation, credits, or access did not update as expected. Please review the billing result and activation state.\n\n" +
          contextLines.join("\n"),
      };
    }

    if (intent === "refund_review") {
      return {
        category: "billing",
        priority: "high",
        subject: "Refund review request",
        message:
          "I want this payment reviewed under the refund policy. Please check whether the transaction qualifies for refund review based on payment evidence and activation outcome.\n\n" +
          contextLines.join("\n"),
      };
    }

    return null;
  }, [
    supportIntent,
    planName,
    planStatus,
    latestPaymentReference,
    latestPaymentDate,
    creditBalance,
    channelState,
    expiresAt,
  ]);

  function setField<K extends keyof SupportFormState>(key: K, value: SupportFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setNotice("");
    setError("");
  }

  useEffect(() => {
    if (!intentPreset) return;

    setForm((prev) => {
      const hasMeaningfulContent =
        prev.subject.trim().length > 0 || prev.message.trim().length > 0 || prev.category !== "general";

      if (hasMeaningfulContent) return prev;

      return {
        category: intentPreset.category,
        priority: intentPreset.priority,
        subject: intentPreset.subject,
        message: intentPreset.message,
      };
    });
  }, [intentPreset]);

  async function loadTickets(selectLatest = false) {
    setLoadingTickets(true);
    try {
      const response = await fetch(apiUrl("/api/support/tickets?limit=20"), {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Could not load support tickets. Status: ${response.status}`
        );
      }

      const rows = Array.isArray(data?.tickets) ? (data.tickets as SupportTicket[]) : [];
      setTickets(rows);

      const currentSelectedStillExists =
        selectedTicketId && rows.some((ticket) => ticket.ticket_id === selectedTicketId);

      if (rows.length === 0) {
        setSelectedTicketId("");
        setSelectedTicket(null);
        setThreadMessages([]);
        return;
      }

      if (selectLatest || !currentSelectedStillExists) {
        const firstTicketId = rows[0]?.ticket_id || "";
        setSelectedTicketId(firstTicketId);
        await loadTicketDetail(firstTicketId);
      }
    } catch (err: any) {
      setError(err?.message || "Could not load support tickets.");
    } finally {
      setLoadingTickets(false);
    }
  }

  async function loadTicketDetail(ticketId: string) {
    if (!ticketId) {
      setSelectedTicket(null);
      setThreadMessages([]);
      return;
    }

    setLoadingThread(true);
    try {
      const response = await fetch(apiUrl(`/api/support/tickets/${ticketId}`), {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Could not load support thread. Status: ${response.status}`
        );
      }

      setSelectedTicket((data?.ticket || null) as SupportTicket | null);
      setThreadMessages(
        Array.isArray(data?.messages) ? (data.messages as SupportMessage[]) : []
      );
      setSelectedTicketId(ticketId);
      setError("");
    } catch (err: any) {
      setError(err?.message || "Could not load support thread.");
    } finally {
      setLoadingThread(false);
    }
  }

  useEffect(() => {
    loadTickets(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleSubmit() {
    if (!form.subject.trim() || !form.message.trim()) {
      setError("Please provide both a support subject and a clear description of the issue.");
      setNotice("");
      return;
    }

    if (form.message.trim().length < 10) {
      setError("Support message must be at least 10 characters long.");
      setNotice("");
      return;
    }

    setSubmitting(true);
    setNotice("");
    setError("");

    try {
      const response = await fetch(apiUrl("/api/support"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          fullName: accountName,
          contactEmail: accountEmail === "Not visible" ? "" : accountEmail,
          issueType: form.category,
          priority: form.priority,
          channel: "web",
          subject: form.subject.trim(),
          message: form.message.trim(),
          planName,
          creditBalance,
          channelState,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Support request could not be submitted. Status: ${response.status}`
        );
      }

      const savedTicketId = data?.ticket?.ticket_id || "Not shown";

      setNotice(
        `Your support request was sent successfully. Ticket ID: ${savedTicketId}. You can now track replies inside the in-app support inbox below.`
      );

      setForm({
        category: "general",
        priority: "normal",
        subject: "",
        message: "",
      });

      await loadTickets(true);

      if (data?.ticket?.ticket_id) {
        await loadTicketDetail(data.ticket.ticket_id);
      }

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err: any) {
      setError(err?.message || "Support request could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReplySubmit() {
    if (!selectedTicketId) {
      setError("Select a support ticket before sending a reply.");
      return;
    }

    if (!replyMessage.trim()) {
      setError("Please write your reply before sending.");
      return;
    }

    if (replyMessage.trim().length < 2) {
      setError("Reply message is too short.");
      return;
    }

    setReplying(true);
    setNotice("");
    setError("");

    try {
      const response = await fetch(
        apiUrl(`/api/support/tickets/${selectedTicketId}/reply`),
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            senderName: accountName,
            message: replyMessage.trim(),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Reply could not be submitted. Status: ${response.status}`
        );
      }

      setNotice(
        `Your reply was sent successfully for ticket ${selectedTicketId}.`
      );
      setReplyMessage("");

      await loadTickets(false);
      await loadTicketDetail(selectedTicketId);
    } catch (err: any) {
      setError(err?.message || "Reply could not be submitted.");
    } finally {
      setReplying(false);
    }
  }

  function handleClear() {
    setForm({
      category: "general",
      priority: "normal",
      subject: "",
      message: "",
    });
    setNotice("");
    setError("");
  }

  return (
    <AppShell
      title="Support"
      subtitle="Report billing, credits, linking, login, or technical issues from one clear support center."
      actions={
        <>
          <button onClick={() => router.push("/help")} style={shellButtonPrimary()}>
            Open Help
          </button>
          <button onClick={() => router.push("/dashboard")} style={shellButtonSecondary()}>
            Back to Dashboard
          </button>
        </>
      }
    >
      <SectionStack>
        {primaryAlert ? (
          <Banner
            tone={primaryAlert.tone}
            title={primaryAlert.title}
            subtitle={primaryAlert.subtitle}
          />
        ) : null}

        {intentPreset ? (
          <Banner
            tone="default"
            title={`Support flow ready: ${safeText(intentPreset.subject, "Support request")}`}
            subtitle="This form was prefilled from your Refund page action. Review the details, add any extra evidence, and submit when ready."
          />
        ) : null}

        {notice ? (
          <Banner
            tone="good"
            title="Support request sent successfully"
            subtitle={notice}
          />
        ) : null}

        {error ? (
          <Banner tone="danger" title="Support request issue" subtitle={error} />
        ) : null}

        <WorkspaceSectionCard
          title="How you’ll receive updates"
          subtitle="Support replies are now available directly inside the app."
        >
          <div style={infoBoxStyle()}>
            <div style={{ color: "var(--text)", lineHeight: 1.8 }}>
              Your support updates will appear in the <strong>In-app support inbox</strong> on
              this page. Important updates may also be sent to your account email when available.
              Keep your ticket ID for easy reference.
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Support center"
          subtitle="Use this page to submit a clear support request together with the visible account context that may help review it faster."
        >
          <div style={pageGridStyle()}>
            <div style={{ display: "grid", gap: 18 }}>
              <div style={infoBoxStyle()}>
                <div style={{ fontSize: 18, fontWeight: 900, color: "var(--text)" }}>
                  Open a support request
                </div>
                <div style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>
                  Choose the issue type, set the priority, and explain clearly what happened.
                </div>
              </div>

              <div style={{ display: "grid", gap: 14 }}>
                <select
                  value={form.category}
                  onChange={(event) => setField("category", event.target.value)}
                  style={appSelectStyle()}
                >
                  <option value="general">Issue type: General support</option>
                  <option value="billing">Issue type: Billing or subscription</option>
                  <option value="credits">Issue type: Credits or access</option>
                  <option value="channels">Issue type: WhatsApp or Telegram linking</option>
                  <option value="login">Issue type: Login or authentication</option>
                  <option value="technical">Issue type: Technical issue</option>
                </select>

                <select
                  value={form.priority}
                  onChange={(event) => setField("priority", event.target.value)}
                  style={appSelectStyle()}
                >
                  <option value="normal">Priority: Normal</option>
                  <option value="high">Priority: High</option>
                  <option value="urgent">Priority: Urgent</option>
                </select>

                <input
                  value={form.subject}
                  onChange={(event) => setField("subject", event.target.value)}
                  placeholder="Support subject"
                  style={appInputStyle()}
                />

                <textarea
                  value={form.message}
                  onChange={(event) => setField("message", event.target.value)}
                  placeholder="Describe the issue clearly. Include what happened, what you expected, and what you already checked."
                  rows={9}
                  style={appTextareaStyle()}
                />

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    style={{
                      ...shellButtonPrimary(),
                      opacity: submitting ? 0.7 : 1,
                      cursor: submitting ? "not-allowed" : "pointer",
                    }}
                  >
                    {submitting ? "Submitting..." : "Submit Support Request"}
                  </button>

                  <button onClick={handleClear} style={shellButtonSecondary()}>
                    Clear Form
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 18 }}>
              <div style={infoBoxStyle()}>
                <div style={{ fontSize: 18, fontWeight: 900, color: "var(--text)" }}>
                  Visible account context
                </div>
                <div style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>
                  This summary helps support understand the likely source of the issue without
                  needing unrelated dashboard details.
                </div>
              </div>

              <CardsGrid min={220}>
                <MetricCard
                  label="Account Email"
                  value={accountEmail}
                  helper="Visible email currently associated with the workspace."
                />
                <MetricCard
                  label="Current Plan"
                  value={planName}
                  tone={activeNow ? "good" : "warn"}
                  helper={`Status: ${planStatus}`}
                />
                <MetricCard
                  label="Credits"
                  value={String(creditBalance)}
                  tone={creditBalance > 0 ? "good" : "warn"}
                  helper="Visible AI credit balance at the time of review."
                />
                <MetricCard
                  label="Channel State"
                  value={channelState}
                  helper="Visible WhatsApp and Telegram linking state."
                />
              </CardsGrid>
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="My support requests"
          subtitle="Track your ticket status and open any ticket to see the full in-app support conversation."
        >
          {loadingTickets ? (
            <Banner tone="default" title="Loading support requests" subtitle="Please wait..." />
          ) : tickets.length === 0 ? (
            <Banner
              tone="default"
              title="No support requests yet"
              subtitle="Your submitted tickets will appear here."
            />
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {tickets.map((ticket) => {
                const active = ticket.ticket_id === selectedTicketId;
                return (
                  <div
                    key={ticket.ticket_id}
                    style={ticketRowStyle(active)}
                    onClick={() => loadTicketDetail(ticket.ticket_id)}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>
                        {ticket.subject || "Untitled support request"}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--text)",
                          opacity: 0.9,
                        }}
                      >
                        {ticket.ticket_id}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        flexWrap: "wrap",
                        color: "var(--text-muted)",
                        fontSize: 14,
                      }}
                    >
                      <span>Status: {ticket.status}</span>
                      <span>Priority: {ticket.priority}</span>
                      <span>Type: {ticket.category}</span>
                      <span>
                        Updated: {ticket.updated_at ? formatDate(ticket.updated_at) : "Not shown"}
                      </span>
                    </div>

                    <div style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>
                      {safeText(
                        ticket.last_message_preview || ticket.message || "No message preview available."
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="In-app support inbox"
          subtitle="Open your selected ticket thread, view support replies, and continue the conversation inside the app."
        >
          {!selectedTicketId ? (
            <Banner
              tone="default"
              title="No ticket selected"
              subtitle="Select a support request above to view its conversation."
            />
          ) : loadingThread ? (
            <Banner tone="default" title="Loading support thread" subtitle="Please wait..." />
          ) : selectedTicket ? (
            <div style={{ display: "grid", gap: 18 }}>
              <div style={infoBoxStyle()}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: 900, color: "var(--text)" }}>
                    {selectedTicket.subject}
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
                    Ticket ID: {selectedTicket.ticket_id}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    color: "var(--text-muted)",
                    fontSize: 14,
                  }}
                >
                  <span>Status: {selectedTicket.status}</span>
                  <span>Priority: {selectedTicket.priority}</span>
                  <span>Type: {selectedTicket.category}</span>
                  <span>
                    Last updated:{" "}
                    {selectedTicket.updated_at
                      ? formatDate(selectedTicket.updated_at)
                      : "Not shown"}
                  </span>
                </div>

                <Banner
                  tone={statusTone(selectedTicket.status)}
                  title={`Current status: ${selectedTicket.status}`}
                  subtitle={
                    selectedTicket.status === "awaiting_user"
                      ? "Support is waiting for your reply."
                      : selectedTicket.status === "resolved"
                      ? "This ticket has been marked as resolved."
                      : selectedTicket.status === "in_review"
                      ? "Your request is currently under review."
                      : "Your support request is open and active."
                  }
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 12,
                  border: "1px solid var(--border)",
                  borderRadius: 18,
                  background: "var(--surface)",
                  padding: 16,
                  minHeight: 220,
                }}
              >
                {threadMessages.length === 0 ? (
                  <Banner
                    tone="default"
                    title="No thread messages yet"
                    subtitle="The original request or future support replies will appear here."
                  />
                ) : (
                  threadMessages.map((msg) => (
                    <div key={msg.id} style={messageBubbleStyle(msg.sender_type)}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ fontWeight: 800, color: "var(--text)" }}>
                          {msg.sender_type === "admin"
                            ? msg.sender_name || "Support Team"
                            : msg.sender_name || "You"}
                        </div>
                        <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                          {msg.created_at ? formatDate(msg.created_at) : "Not shown"}
                        </div>
                      </div>
                      <div
                        style={{
                          color: "var(--text)",
                          lineHeight: 1.8,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {msg.message}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={infoBoxStyle()}>
                <div style={{ fontSize: 17, fontWeight: 900, color: "var(--text)" }}>
                  Reply in-app
                </div>
                <div style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>
                  Send your follow-up directly from this page. Your message will become part of the
                  ticket conversation.
                </div>

                <textarea
                  value={replyMessage}
                  onChange={(event) => {
                    setReplyMessage(event.target.value);
                    setNotice("");
                    setError("");
                  }}
                  placeholder="Write your reply to support here..."
                  rows={5}
                  style={appTextareaStyle()}
                />

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button
                    onClick={handleReplySubmit}
                    disabled={replying}
                    style={{
                      ...shellButtonPrimary(),
                      opacity: replying ? 0.7 : 1,
                      cursor: replying ? "not-allowed" : "pointer",
                    }}
                  >
                    {replying ? "Sending reply..." : "Send Reply"}
                  </button>

                  <button
                    onClick={() => setReplyMessage("")}
                    style={shellButtonSecondary()}
                  >
                    Clear Reply
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Banner
              tone="default"
              title="Support thread not available"
              subtitle="Select a valid ticket to view its thread."
            />
          )}
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Before submitting"
          subtitle="Only the most relevant checks before you open a support request."
        >
          <div
            style={{
              display: "grid",
              gap: 12,
              color: "var(--text)",
              fontSize: 15,
              lineHeight: 1.8,
            }}
          >
            <div style={infoBoxStyle()}>
              Check Billing if the issue is about subscription status, renewal, or plan access.
            </div>
            <div style={infoBoxStyle()}>
              Check Credits if the assistant stops answering or access feels unexpectedly limited.
            </div>
            <div style={infoBoxStyle()}>
              Check Channels if the issue involves WhatsApp or Telegram linking behavior.
            </div>
            <div style={infoBoxStyle()}>
              Use Help first if you are unsure whether the issue is billing, credits, channels, or
              normal app behavior.
            </div>
          </div>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
