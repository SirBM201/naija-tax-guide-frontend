"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type WorkspacePlan = {
  active?: boolean;
  audience?: string;
  code?: string;
  credits?: number;
  currency?: string;
  cycle?: string;
  description?: string;
  duration_days?: number;
  max_linked_web_accounts?: number;
  max_telegram_channels?: number;
  max_total_channels?: number;
  max_whatsapp_channels?: number;
  max_workspace_users?: number;
  name?: string;
  plan_family?: string;
  price?: number;
  recommended?: boolean;
  sort_order?: number;
  support_level?: string;
  tier?: string;
};

type WorkspaceLimits = {
  max_linked_web_accounts?: number;
  max_workspace_users?: number;
};

type ChannelLimits = {
  max_telegram_channels?: number;
  max_total_channels?: number;
  max_whatsapp_channels?: number;
};

type Entitlements = {
  account_id?: string;
  channel_limits?: ChannelLimits;
  ok?: boolean;
  plan?: WorkspacePlan;
  plan_code?: string;
  plan_family?: string;
  subscription?: Record<string, unknown>;
  workspace_limits?: WorkspaceLimits;
};

type Counts = {
  active_members_only?: number;
  owner_included_total?: number;
};

type OwnerRecord = {
  account_id?: string;
  created_at?: string;
  display_name?: string | null;
  email?: string | null;
  id?: string;
  provider?: string;
  provider_user_id?: string;
  updated_at?: string;
};

type MemberRecord = {
  id?: string;
  owner_account_id?: string;
  member_account_id?: string;
  role?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  member_email?: string | null;
  member_display_name?: string | null;
  member_provider?: string | null;
  member_provider_user_id?: string | null;
};

type LimitsResponse = {
  account_id?: string;
  counts?: Counts;
  entitlements?: Entitlements;
  ok?: boolean;
};

type MembersResponse = {
  account_id?: string;
  count?: number;
  counts?: Counts;
  entitlements?: Entitlements;
  members?: MemberRecord[] | Record<string, never>;
  ok?: boolean;
  owner?: OwnerRecord;
};

type ApiErrorShape = {
  error?: string;
  message?: string;
  reason?: string;
  fix?: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  "https://incredible-nonie-bmsconcept-37359733.koyeb.app";

function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function normalizeMembers(input: MembersResponse["members"]): MemberRecord[] {
  if (Array.isArray(input)) return input;
  return [];
}

function extractErrorMessage(payload: ApiErrorShape | null, fallback: string) {
  if (!payload) return fallback;
  return payload.fix || payload.message || payload.error || payload.reason || fallback;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const text = await response.text();
  let data: unknown = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = extractErrorMessage(
      (data as ApiErrorShape | null) ?? null,
      `Request failed with status ${response.status}`
    );
    throw new Error(message);
  }

  return data as T;
}

export default function WorkspacePage() {
  const [limits, setLimits] = useState<LimitsResponse | null>(null);
  const [membersData, setMembersData] = useState<MembersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [memberEmail, setMemberEmail] = useState("");
  const [role, setRole] = useState("member");
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [addMessage, setAddMessage] = useState("");
  const [addError, setAddError] = useState("");

  const [removingId, setRemovingId] = useState("");
  const [removeMessage, setRemoveMessage] = useState("");
  const [removeError, setRemoveError] = useState("");

  const loadWorkspace = useCallback(async (isRefresh = false) => {
    try {
      setPageError("");
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [limitsRes, membersRes] = await Promise.all([
        apiRequest<LimitsResponse>("/api/workspace/limits"),
        apiRequest<MembersResponse>("/api/workspace/members"),
      ]);

      setLimits(limitsRes);
      setMembersData(membersRes);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load workspace data.";
      setPageError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const plan = limits?.entitlements?.plan || membersData?.entitlements?.plan;
  const workspaceLimits =
    limits?.entitlements?.workspace_limits ||
    membersData?.entitlements?.workspace_limits ||
    {};
  const channelLimits =
    limits?.entitlements?.channel_limits ||
    membersData?.entitlements?.channel_limits ||
    {};
  const counts = membersData?.counts || limits?.counts || {};
  const owner = membersData?.owner;
  const members = useMemo(
    () => normalizeMembers(membersData?.members),
    [membersData?.members]
  );

  const usedSlots = counts.owner_included_total ?? 0;
  const memberOnlyCount = counts.active_members_only ?? members.length ?? 0;
  const maxWorkspaceUsers = workspaceLimits.max_workspace_users ?? 0;
  const availableSlots =
    maxWorkspaceUsers > 0 ? Math.max(maxWorkspaceUsers - usedSlots, 0) : 0;

  async function handleAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAddMessage("");
    setAddError("");
    setRemoveMessage("");
    setRemoveError("");

    const cleanEmail = memberEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setAddError("Enter the email address of an existing web account.");
      return;
    }

    try {
      setSubmittingAdd(true);

      const result = await apiRequest<{
        ok?: boolean;
        message?: string;
        fix?: string;
      }>("/api/workspace/members/add", {
        method: "POST",
        body: JSON.stringify({
          member_email: cleanEmail,
          role,
        }),
      });

      setAddMessage(result.message || "Member added successfully.");
      setMemberEmail("");
      setRole("member");
      await loadWorkspace(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to add workspace member.";
      setAddError(message);
    } finally {
      setSubmittingAdd(false);
    }
  }

  async function handleRemoveMember(memberAccountId?: string) {
    if (!memberAccountId) return;

    setAddMessage("");
    setAddError("");
    setRemoveMessage("");
    setRemoveError("");

    try {
      setRemovingId(memberAccountId);

      const result = await apiRequest<{
        ok?: boolean;
        message?: string;
        fix?: string;
      }>("/api/workspace/members/remove", {
        method: "POST",
        body: JSON.stringify({
          member_account_id: memberAccountId,
        }),
      });

      setRemoveMessage(result.message || "Member removed successfully.");
      await loadWorkspace(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to remove workspace member.";
      setRemoveError(message);
    } finally {
      setRemovingId("");
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fc] px-4 py-6 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Workspace
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Manage your owner account, workspace member slots, and current plan
              limits from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadWorkspace(true)}
            disabled={loading || refreshing}
            className={classNames(
              "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white transition",
              loading || refreshing
                ? "cursor-not-allowed bg-slate-400"
                : "bg-indigo-600 hover:bg-indigo-700"
            )}
          >
            {refreshing ? "Refreshing..." : "Refresh Status"}
          </button>
        </div>

        {pageError ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {pageError}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="animate-pulse space-y-4">
              <div className="h-7 w-48 rounded bg-slate-200" />
              <div className="grid gap-4 md:grid-cols-4">
                <div className="h-28 rounded-2xl bg-slate-200" />
                <div className="h-28 rounded-2xl bg-slate-200" />
                <div className="h-28 rounded-2xl bg-slate-200" />
                <div className="h-28 rounded-2xl bg-slate-200" />
              </div>
            </div>
          </div>
        ) : (
          <>
            <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Current plan
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  {plan?.name || "No active plan"}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Family:{" "}
                  <span className="font-semibold capitalize text-slate-800">
                    {limits?.entitlements?.plan_family || plan?.plan_family || "—"}
                  </span>
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Code:{" "}
                  <span className="font-medium text-slate-800">
                    {limits?.entitlements?.plan_code || plan?.code || "—"}
                  </span>
                </p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Workspace slots used
                </p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                  {usedSlots}
                  <span className="text-lg font-medium text-slate-500">
                    {" "}
                    / {maxWorkspaceUsers || 0}
                  </span>
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Owner included total
                </p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Additional members
                </p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                  {memberOnlyCount}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Active members only
                </p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Available slots
                </p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                  {availableSlots}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Remaining under this plan
                </p>
              </div>
            </section>

            <section className="mb-6 grid gap-4 lg:grid-cols-3">
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">Workspace limits</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span>Max workspace users</span>
                    <span className="font-semibold">
                      {workspaceLimits.max_workspace_users ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span>Max linked web accounts</span>
                    <span className="font-semibold">
                      {workspaceLimits.max_linked_web_accounts ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">Channel limits</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span>Total channels</span>
                    <span className="font-semibold">
                      {channelLimits.max_total_channels ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span>WhatsApp channels</span>
                    <span className="font-semibold">
                      {channelLimits.max_whatsapp_channels ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span>Telegram channels</span>
                    <span className="font-semibold">
                      {channelLimits.max_telegram_channels ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">Workspace owner</h3>
                <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {owner?.display_name || owner?.email || "Owner account"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {owner?.email || "—"}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">
                    Role
                  </p>
                  <p className="text-sm font-medium text-slate-800">Owner</p>
                  <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">
                    Created
                  </p>
                  <p className="text-sm text-slate-700">
                    {formatDate(owner?.created_at)}
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-6 grid gap-6 lg:grid-cols-[1.05fr_1.4fr]">
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">Add member</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Enter the email address of an existing web account you want to add
                  into this workspace.
                </p>

                <form className="mt-5 space-y-4" onSubmit={handleAddMember}>
                  <div>
                    <label
                      htmlFor="member_email"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Member email
                    </label>
                    <input
                      id="member_email"
                      type="email"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="member_role"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Role
                    </label>
                    <select
                      id="member_role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="member">member</option>
                    </select>
                  </div>

                  {addMessage ? (
                    <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                      {addMessage}
                    </div>
                  ) : null}

                  {addError ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {addError}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={submittingAdd}
                    className={classNames(
                      "w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition",
                      submittingAdd
                        ? "cursor-not-allowed bg-slate-400"
                        : "bg-indigo-600 hover:bg-indigo-700"
                    )}
                  >
                    {submittingAdd ? "Adding member..." : "Add member"}
                  </button>
                </form>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-800">Current rule</p>
                  <p className="mt-1">
                    Your plan currently allows{" "}
                    <span className="font-semibold text-slate-900">
                      {maxWorkspaceUsers || 0}
                    </span>{" "}
                    total workspace user{maxWorkspaceUsers === 1 ? "" : "s"},
                    including the owner.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Workspace members
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Member accounts linked under this workspace owner.
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {memberOnlyCount} member{memberOnlyCount === 1 ? "" : "s"}
                  </span>
                </div>

                {removeMessage ? (
                  <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {removeMessage}
                  </div>
                ) : null}

                {removeError ? (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {removeError}
                  </div>
                ) : null}

                <div className="mt-5 space-y-4">
                  {members.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
                      No extra workspace members have been added yet.
                    </div>
                  ) : (
                    members.map((member) => {
                      const display =
                        member.member_display_name ||
                        member.member_email ||
                        member.member_provider_user_id ||
                        member.member_account_id ||
                        "Workspace member";

                      return (
                        <div
                          key={member.member_account_id || member.id}
                          className="rounded-2xl border border-slate-200 p-4"
                        >
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {display}
                              </p>
                              <p className="mt-1 text-sm text-slate-600">
                                {member.member_email || "No email available"}
                              </p>

                              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <div>
                                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                                    Role
                                  </p>
                                  <p className="text-sm font-medium text-slate-800">
                                    {member.role || "member"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                                    Status
                                  </p>
                                  <p className="text-sm font-medium capitalize text-slate-800">
                                    {member.status || "active"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                                    Added
                                  </p>
                                  <p className="text-sm text-slate-700">
                                    {formatDate(member.created_at)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                                    Member account ID
                                  </p>
                                  <p className="break-all text-sm text-slate-700">
                                    {member.member_account_id || "—"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={
                                removingId === member.member_account_id ||
                                !member.member_account_id
                              }
                              onClick={() =>
                                void handleRemoveMember(member.member_account_id)
                              }
                              className={classNames(
                                "inline-flex min-w-[140px] items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition",
                                removingId === member.member_account_id
                                  ? "cursor-not-allowed bg-slate-200 text-slate-500"
                                  : "bg-red-50 text-red-700 hover:bg-red-100"
                              )}
                            >
                              {removingId === member.member_account_id
                                ? "Removing..."
                                : "Remove"}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
