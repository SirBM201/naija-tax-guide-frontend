"use client";

import React, { useEffect, useMemo, useState } from "react";
import AppShell, {
  shellButtonPrimary,
  shellButtonSecondary,
} from "@/components/app-shell";
import { apiJson, isApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type ReferralProfile = {
  id?: string;
  account_id?: string;
  referral_code?: string | null;
  referral_link?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ReferralRow = {
  id?: string;
  referrer_account_id?: string;
  referred_account_id?: string;
  referral_code?: string;
  status?: string;
  source?: string | null;
  signup_at?: string | null;
  qualified_at?: string | null;
  disqualified_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type RewardRow = {
  id?: string;
  referral_id?: string;
  account_id?: string;
  reward_type?: string;
  reward_amount?: string | number;
  currency?: string;
  status?: string;
  plan_code?: string | null;
  payment_reference?: string | null;
  earned_at?: string | null;
  approved_at?: string | null;
  paid_at?: string | null;
  reversed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type PayoutRow = {
  id?: string;
  account_id?: string;
  amount?: string | number;
  currency?: string;
  status?: string;
  payout_method?: string | null;
  created_at?: string | null;
  paid_at?: string | null;
};

type ReferralTotals = {
  total_referrals?: number;
  qualified_referrals?: number;
  pending_referrals?: number;
  disqualified_referrals?: number;
  expired_referrals?: number;
  pending_rewards?: string;
  approved_rewards?: string;
  paid_rewards?: string;
  reversed_rewards?: string;
  available_balance?: string;
  level1_rewards_total?: string;
  level2_rewards_total?: string;
  currency?: string;
  payout_count?: number;
};

type ReferralSummary = {
  profile?: ReferralProfile | null;
  totals?: ReferralTotals | null;
  recent_referrals?: ReferralRow[];
  recent_rewards?: RewardRow[];
  recent_payouts?: PayoutRow[];
  config?: Record<string, unknown>;
};

type ReferralMeResponse = {
  ok?: boolean;
  account_id?: string;
  profile?: ReferralProfile | null;
  summary?: ReferralSummary | null;
  approved_payout_balance?: string;
  error?: string;
  root_cause?: string;
  fix?: string;
};

type ReferralHistoryResponse = {
  ok?: boolean;
  rows?: ReferralRow[];
  count?: number;
  error?: string;
  root_cause?: string;
};

type ReferralRewardsResponse = {
  ok?: boolean;
  rows?: RewardRow[];
  count?: number;
  error?: string;
  root_cause?: string;
};

type ReferralPayoutsResponse = {
  ok?: boolean;
  rows?: PayoutRow[];
  count?: number;
  error?: string;
  root_cause?: string;
};

function safeText(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function safeNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatDate(value: unknown): string {
  if (!value) return "—";
  const raw = String(value);
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleString();
}

function cardStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 20,
    background: "var(--surface)",
    padding: 20,
    display: "grid",
    gap: 14,
  };
}

function statCardStyle(): React.CSSProperties {
  return {
    border: "1px solid var(--border)",
    borderRadius: 18,
    background: "var(--surface-soft)",
    padding: 18,
    display: "grid",
    gap: 6,
  };
}

function sectionTitleStyle(): React.CSSProperties {
  return {
    fontSize: 18,
    fontWeight: 900,
    color: "var(--text)",
  };
}

function mutedStyle(): React.CSSProperties {
  return {
    color: "var(--text-muted)",
    lineHeight: 1.65,
  };
}

async function copyText(value: string, label: string) {
  const text = value.trim();
  if (!text || text === "—") {
    window.alert(`${label} is not available yet.`);
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    window.alert(`${label} copied successfully.`);
  } catch {
    window.alert(`Could not copy ${label.toLowerCase()} automatically.`);
  }
}

function buildInviteMessage(referralCode: string, referralLink: string): string {
  const code = referralCode.trim();
  const link = referralLink.trim();

  if (!link || link === "—") {
    return "Join Naija Tax Guide and use my referral code.";
  }

  return [
    "Join me on Naija Tax Guide for AI-powered tax guidance.",
    "",
    `Referral code: ${code || "Not available"}`,
    `Signup link: ${link}`,
  ].join("\n");
}

function openWhatsAppShare(message: string) {
  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${encoded}`, "_blank", "noopener,noreferrer");
}

function openTelegramShare(message: string) {
  const encoded = encodeURIComponent(message);
  window.open(`https://t.me/share/url?text=${encoded}`, "_blank", "noopener,noreferrer");
}

export default function ReferralsPage() {
  const { authReady, requireAuth } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [meData, setMeData] = useState<ReferralMeResponse | null>(null);
  const [historyData, setHistoryData] = useState<ReferralHistoryResponse | null>(null);
  const [rewardsData, setRewardsData] = useState<ReferralRewardsResponse | null>(null);
  const [payoutsData, setPayoutsData] = useState<ReferralPayoutsResponse | null>(null);

  const [errorText, setErrorText] = useState("");

  async function loadAll(showRefreshState = false) {
    if (!requireAuth()) return;

    if (showRefreshState) setRefreshing(true);
    else setLoading(true);

    setErrorText("");

    try {
      const [me, history, rewards, payouts] = await Promise.all([
        apiJson<ReferralMeResponse>("/referrals/me", {
          method: "GET",
          useAuthToken: false,
          timeoutMs: 15000,
        }),
        apiJson<ReferralHistoryResponse>("/referrals/history", {
          method: "GET",
          query: { limit: 20 },
          useAuthToken: false,
          timeoutMs: 15000,
        }),
        apiJson<ReferralRewardsResponse>("/referrals/rewards", {
          method: "GET",
          query: { limit: 20 },
          useAuthToken: false,
          timeoutMs: 15000,
        }),
        apiJson<ReferralPayoutsResponse>("/referrals/payouts", {
          method: "GET",
          query: { limit: 20 },
          useAuthToken: false,
          timeoutMs: 15000,
        }),
      ]);

      setMeData(me);
      setHistoryData(history);
      setRewardsData(rewards);
      setPayoutsData(payouts);
    } catch (e: unknown) {
      if (isApiError(e)) {
        setErrorText(
          safeText(
            e.data?.error || e.data?.root_cause || e.message,
            "Could not load referral data."
          )
        );
      } else if (e instanceof Error) {
        setErrorText(e.message);
      } else {
        setErrorText("Could not load referral data.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!authReady) return;
    void loadAll(false);
  }, [authReady]);

  const profile = meData?.summary?.profile || meData?.profile || null;
  const totals = meData?.summary?.totals || {};
  const recentReferrals = historyData?.rows || meData?.summary?.recent_referrals || [];
  const recentRewards = rewardsData?.rows || meData?.summary?.recent_rewards || [];
  const recentPayouts = payoutsData?.rows || meData?.summary?.recent_payouts || [];

  const referralCode = safeText(profile?.referral_code, "—");
  const referralLink = safeText(profile?.referral_link, "—");
  const currency = safeText(totals.currency, "NGN");
  const inviteMessage = buildInviteMessage(referralCode, referralLink);

  const statItems = useMemo(
    () => [
      {
        label: "Total Referrals",
        value: String(safeNumber(totals.total_referrals, 0)),
        helper: "All users who joined through your referral path.",
      },
      {
        label: "Qualified Referrals",
        value: String(safeNumber(totals.qualified_referrals, 0)),
        helper: "Referrals that reached the qualifying stage.",
      },
      {
        label: "Available Balance",
        value: `${currency} ${safeText(totals.available_balance, "0")}`,
        helper: "Approved referral balance currently available.",
      },
      {
        label: "Pending Rewards",
        value: `${currency} ${safeText(totals.pending_rewards, "0")}`,
        helper: "Rewards still under the waiting or hold stage.",
      },
      {
        label: "Approved Rewards",
        value: `${currency} ${safeText(totals.approved_rewards, "0")}`,
        helper: "Approved rewards recorded for your account.",
      },
      {
        label: "Paid Rewards",
        value: `${currency} ${safeText(totals.paid_rewards, "0")}`,
        helper: "Rewards already marked as paid out.",
      },
    ],
    [currency, totals]
  );

  return (
    <AppShell
      title="Referrals"
      subtitle="View your referral code, copy your invite link, and monitor referrals, rewards, and payouts from one workspace."
      actions={
        <>
          <button
            type="button"
            style={shellButtonPrimary()}
            onClick={() => void loadAll(true)}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            style={shellButtonSecondary()}
            onClick={() => void copyText(referralCode, "Referral code")}
          >
            Copy Code
          </button>

          <button
            type="button"
            style={shellButtonSecondary()}
            onClick={() => void copyText(referralLink, "Referral link")}
          >
            Copy Link
          </button>

          <button
            type="button"
            style={shellButtonSecondary()}
            onClick={() => openWhatsAppShare(inviteMessage)}
          >
            Share WhatsApp
          </button>

          <button
            type="button"
            style={shellButtonSecondary()}
            onClick={() => openTelegramShare(inviteMessage)}
          >
            Share Telegram
          </button>
        </>
      }
    >
      <div style={{ display: "grid", gap: 20 }}>
        {loading ? (
          <div style={cardStyle()}>
            <div style={sectionTitleStyle()}>Loading referral workspace...</div>
            <div style={mutedStyle()}>
              Please wait while your referral profile, counts, and reward records are being loaded.
            </div>
          </div>
        ) : null}

        {!loading && errorText ? (
          <div style={cardStyle()}>
            <div style={sectionTitleStyle()}>Referral page could not load</div>
            <div style={{ ...mutedStyle(), color: "#fca5a5" }}>{errorText}</div>
            <div style={mutedStyle()}>
              The backend referral routes are already in place. Any remaining issue should now be limited to response data or environment wiring.
            </div>
          </div>
        ) : null}

        {!loading && !errorText ? (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.15fr) minmax(280px, 0.85fr)",
                gap: 20,
                alignItems: "start",
              }}
            >
              <div style={cardStyle()}>
                <div style={sectionTitleStyle()}>Your referral profile</div>
                <div style={mutedStyle()}>
                  Share your referral code or invite link to bring new users into Naija Tax Guide.
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  <div style={statCardStyle()}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-muted)" }}>
                      Referral Code
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: "var(--text)" }}>
                      {referralCode}
                    </div>
                  </div>

                  <div style={statCardStyle()}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-muted)" }}>
                      Referral Link
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "var(--text)",
                        lineHeight: 1.6,
                        wordBreak: "break-word",
                      }}
                    >
                      {referralLink}
                    </div>
                  </div>

                  <div style={statCardStyle()}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-muted)" }}>
                      Ready-to-share invite message
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--text)",
                        lineHeight: 1.7,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {inviteMessage}
                    </div>
                  </div>

                  <div style={mutedStyle()}>
                    This web page now mirrors the same referral profile details already showing correctly inside Telegram.
                  </div>
                </div>
              </div>

              <div style={cardStyle()}>
                <div style={sectionTitleStyle()}>Status summary</div>
                <div style={mutedStyle()}>
                  Quick view of totals, reward balances, and payout-ready status.
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  {statItems.map((item) => (
                    <div key={item.label} style={statCardStyle()}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-muted)" }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: "var(--text)" }}>
                        {item.value}
                      </div>
                      <div style={mutedStyle()}>{item.helper}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={cardStyle()}>
              <div style={sectionTitleStyle()}>Recent referrals</div>
              <div style={mutedStyle()}>
                Latest users tied to your referral activity.
              </div>

              {recentReferrals.length === 0 ? (
                <div style={mutedStyle()}>No referrals yet.</div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {recentReferrals.map((row, rowIndex) => (
                    <div key={String(row.id || rowIndex)} style={statCardStyle()}>
                      <div style={{ fontWeight: 800, color: "var(--text)" }}>
                        Referred Account: {safeText(row.referred_account_id)}
                      </div>
                      <div style={mutedStyle()}>
                        Status: {safeText(row.status)} • Source: {safeText(row.source)}
                      </div>
                      <div style={mutedStyle()}>
                        Signup Time: {formatDate(row.signup_at || row.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 20,
                alignItems: "start",
              }}
            >
              <div style={cardStyle()}>
                <div style={sectionTitleStyle()}>Recent rewards</div>
                <div style={mutedStyle()}>
                  Latest reward ledger entries tied to your referral activity.
                </div>

                {recentRewards.length === 0 ? (
                  <div style={mutedStyle()}>No rewards yet.</div>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {recentRewards.map((row, rowIndex) => (
                      <div key={String(row.id || rowIndex)} style={statCardStyle()}>
                        <div style={{ fontWeight: 800, color: "var(--text)" }}>
                          {safeText(row.reward_type)} — {currency} {safeText(row.reward_amount, "0")}
                        </div>
                        <div style={mutedStyle()}>
                          Status: {safeText(row.status)} • Plan: {safeText(row.plan_code)}
                        </div>
                        <div style={mutedStyle()}>
                          Earned: {formatDate(row.earned_at || row.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={cardStyle()}>
                <div style={sectionTitleStyle()}>Recent payouts</div>
                <div style={mutedStyle()}>
                  Payout records already created for your referral account.
                </div>

                {recentPayouts.length === 0 ? (
                  <div style={mutedStyle()}>No payouts yet.</div>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {recentPayouts.map((row, rowIndex) => (
                      <div key={String(row.id || rowIndex)} style={statCardStyle()}>
                        <div style={{ fontWeight: 800, color: "var(--text)" }}>
                          {currency} {safeText(row.amount, "0")}
                        </div>
                        <div style={mutedStyle()}>
                          Status: {safeText(row.status)} • Method: {safeText(row.payout_method)}
                        </div>
                        <div style={mutedStyle()}>
                          Created: {formatDate(row.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}