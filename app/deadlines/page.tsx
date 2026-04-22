"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/app-shell";
import { SectionStack } from "@/components/page-layout";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { apiJson } from "@/lib/api";
import { useWorkspaceState } from "@/hooks/useWorkspaceState";
import { useAuth } from "@/lib/auth";

type Deadline = {
  id: string;
  tax_type: string;
  due_date: string;
  reminder_days_before: number;
  enabled: boolean;
};

export default function DeadlinesPage() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const { accountId } = useWorkspaceState({
    refreshSession,
    autoLoad: true,
    includeAccount: true,
  });

  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    tax_type: "paye",
    due_date: "",
    reminder_days_before: 7,
    enabled: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchDeadlines = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    try {
      const res = await apiJson(`/api/deadlines?userId=${accountId}`, { method: "GET" });
      if (res.ok && Array.isArray(res.deadlines)) {
        setDeadlines(res.deadlines);
      } else {
        setDeadlines([]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load deadlines");
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    if (accountId) {
      fetchDeadlines();
    }
  }, [accountId, fetchDeadlines]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      setError("Account not loaded");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (editingId) {
        await apiJson("/api/deadlines", {
          method: "PUT",
          body: JSON.stringify({ id: editingId, userId: accountId, ...formData }),
        });
      } else {
        await apiJson("/api/deadlines", {
          method: "POST",
          body: JSON.stringify({ userId: accountId, ...formData }),
        });
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ tax_type: "paye", due_date: "", reminder_days_before: 7, enabled: true });
      await fetchDeadlines();
    } catch (err: any) {
      setError(err.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this deadline?")) return;
    try {
      await apiJson(`/api/deadlines?id=${id}&userId=${accountId}`, { method: "DELETE" });
      await fetchDeadlines();
    } catch (err: any) {
      setError(err.message || "Delete failed");
    }
  };

  const handleEdit = (deadline: Deadline) => {
    setFormData({
      tax_type: deadline.tax_type,
      due_date: deadline.due_date.slice(0, 10),
      reminder_days_before: deadline.reminder_days_before,
      enabled: deadline.enabled,
    });
    setEditingId(deadline.id);
    setShowForm(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB");
  };

  const getDaysRemaining = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <AppShell title="Tax Deadlines" subtitle="Set and track important tax filing deadlines with reminders.">
      <SectionStack>
        <WorkspaceSectionCard title="Your Deadlines">
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setFormData({ tax_type: "paye", due_date: "", reminder_days_before: 7, enabled: true });
            }}
            style={{
              marginBottom: 20,
              padding: "10px 20px",
              background: "#3b82f6",
              border: "none",
              borderRadius: 12,
              color: "white",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            + Add Deadline
          </button>

          {error && (
            <div style={{ padding: 12, background: "rgba(244,63,94,0.1)", borderRadius: 12, color: "#dc2626", marginBottom: 16 }}>
              {error}
            </div>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} style={{ marginBottom: 24, padding: 20, border: "1px solid var(--border)", borderRadius: 20 }}>
              <h3 style={{ marginBottom: 16 }}>{editingId ? "Edit Deadline" : "New Deadline"}</h3>
              <div style={{ display: "grid", gap: 16, marginBottom: 20 }}>
                <div>
                  <label>Tax Type</label>
                  <select
                    value={formData.tax_type}
                    onChange={(e) => setFormData({ ...formData, tax_type: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }}
                  >
                    <option value="paye">PAYE (Employee Tax)</option>
                    <option value="vat">VAT</option>
                    <option value="cit">Company Income Tax (CIT)</option>
                  </select>
                </div>
                <div>
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                    style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }}
                  />
                </div>
                <div>
                  <label>Remind me (days before)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.reminder_days_before}
                    onChange={(e) => setFormData({ ...formData, reminder_days_before: parseInt(e.target.value) || 7 })}
                    style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }}
                  />
                </div>
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={formData.enabled}
                      onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    />
                    Active (receive reminders)
                  </label>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button type="submit" disabled={submitting} style={{ padding: "10px 20px", background: "#10b981", border: "none", borderRadius: 12, color: "white", fontWeight: 800, cursor: "pointer" }}>
                  {submitting ? "Saving..." : editingId ? "Update" : "Save"}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} style={{ padding: "10px 20px", background: "var(--surface-soft)", border: "1px solid var(--border)", borderRadius: 12, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div>Loading deadlines...</div>
          ) : deadlines.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
              No deadlines added yet. Click "Add Deadline" to set your first reminder.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {deadlines.map((dl) => {
                const daysRemaining = getDaysRemaining(dl.due_date);
                const isUrgent = daysRemaining <= dl.reminder_days_before && daysRemaining >= 0;
                const isOverdue = daysRemaining < 0;
                return (
                  <div
                    key={dl.id}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: 18,
                      padding: 16,
                      background: isUrgent ? "rgba(245,158,11,0.1)" : isOverdue ? "rgba(244,63,94,0.1)" : "var(--surface)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
                      <strong style={{ fontSize: 16, textTransform: "uppercase" }}>{dl.tax_type}</strong>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => handleEdit(dl)} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer" }}>Edit</button>
                        <button onClick={() => handleDelete(dl.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}>Delete</button>
                      </div>
                    </div>
                    <div>Due: {formatDate(dl.due_date)}</div>
                    <div>Remind {dl.reminder_days_before} days before</div>
                    <div>Status: {isOverdue ? "⚠️ Overdue" : isUrgent ? "🔔 Upcoming soon" : dl.enabled ? "✅ Active" : "❌ Disabled"}</div>
                    {isUrgent && !isOverdue && daysRemaining >= 0 && (
                      <div style={{ marginTop: 8, fontSize: 13, color: "#f59e0b" }}>
                        Reminder: This deadline is in {daysRemaining} days!
                      </div>
                    )}
                    {isOverdue && (
                      <div style={{ marginTop: 8, fontSize: 13, color: "#dc2626" }}>
                        This deadline has passed.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
