"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  provider?: string | null;
  provider_reference?: string | null;
  provider_transfer_code?: string | null;
  requested_at?: string | null;
  created_at?: string | null;
  processed_at?: string | null;
  paid_at?: string | null;
  failed_at?: string | null;
  failure_reason?: string | null;
};

type PayoutAccount = {
  id?: string;
  account_id?: string;
  provider?: string | null;
  bank_code?: string | null;
  bank_name?: string | null;
  account_name?: string | null;
  account_number_masked?: string | null;
  recipient_code?: string | null;
  currency?: string | null;
  is_verified?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type PayoutEligibility = {
  ok?: boolean;
  account_id?: string;
  payout_account?: PayoutAccount | null;
  has_payout_account?: boolean;
  approved_reward_count?: number;
  approved_reward_amount?: number;
  open_payout_count?: number;
  open_payout_amount?: number;
  available_amount?: number;
  minimum_amount?: number;
  eligible?: boolean;
  minimum_reached?: boolean;
  requires_verified_account?: boolean;
  is_verified?: boolean;
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
  payout_account?: PayoutAccount | null;
  payout_eligibility?: PayoutEligibility | null;
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

type NoticeTone = "good" | "warn" | "danger";

type NoticeState = {
  tone: NoticeTone;
  title: string;
  subtitle: string;
} | null;

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

function formatMoney(value: unknown, currency = "NGN"): string {
  return `${currency} ${safeNumber(value, 0).toFixed(2)}`;
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

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    minHeight: 50,
    border: "1px solid var(--border)",
    borderRadius: 14,
    background: "var(--surface)",
    color: "var(--text)",
    padding: "0 14px",
    outline: "none",
  };
}

function labelStyle(): React.CSSProperties {
  return {
    fontSize: 13,
    fontWeight: 800,
    color: "var(--text-muted)",
  };
}

function valueStyle(): React.CSSProperties {
  return {
    fontSize: 24,
    fontWeight: 900,
    color: "var(--text)",
  };
}

function twoColumnGridStyle(): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 20,
    alignItems: "start",
  };
}

function buttonStyleWithDisabledState(
  baseStyle: React.CSSProperties,
  disabled: boolean
): React.CSSProperties {
  if (!disabled) {
    return {
      ...baseStyle,
      cursor: "pointer",
      opacity: 1,
    };
  }

  return {
    ...baseStyle,
    cursor: "not-allowed",
    opacity: 1,
    background: "#e5e7eb",
    color: "#6b7280",
    border: "1px solid #d1d5db",
    boxShadow: "none",
    filter: "grayscale(0.12)",
    transform: "none",
  };
}

function toneStyle(tone: NoticeTone): React.CSSProperties {
  if (tone === "good") {
    return {
      border: "1px solid rgba(34,197,94,0.25)",
      background: "rgba(34,197,94,0.08)",
    };
  }
  if (tone === "warn") {
    return {
      border: "1px solid rgba(245,158,11,0.25)",
      background: "rgba(245,158,11,0.08)",
    };
  }
  return {
    border: "1px solid rgba(239,68,68,0.25)",
    background: "rgba(239,68,68,0.08)",
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
  const [savingAccount, setSavingAccount] = useState(false);
  const [requestingPayout, setRequestingPayout] = useState(false);

  const [meData, setMeData] = useState<ReferralMeResponse | null>(null);
  const [historyData, setHistoryData] = useState<ReferralHistoryResponse | null>(null);
  const [rewardsData, setRewardsData] = useState<ReferralRewardsResponse | null>(null);
  const [payoutsData, setPayoutsData] = useState<ReferralPayoutsResponse | null>(null);

  const [errorText, setErrorText] = useState("");
  const [notice, setNotice] = useState<NoticeState>(null);

  const [provider, setProvider] = useState("paystack");
  const [bankCode, setBankCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountNumberMasked, setAccountNumberMasked] = useState("");
  const [recipientCode, setRecipientCode] = useState("");
  const [currencyInput, setCurrencyInput] = useState("NGN");
  const [isVerified, setIsVerified] = useState(false);

  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutProviderReference, setPayoutProviderReference] = useState("");
  const [payoutTransferCode, setPayoutTransferCode] = useState("");

  const loadAll = useCallback(
    async (showRefreshState = false) => {
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

        const loadedPayoutAccount =
          me?.payout_account || me?.payout_eligibility?.payout_account || null;

        if (loadedPayoutAccount) {
          setProvider(safeText(loadedPayoutAccount.provider, "paystack"));
          setBankCode(safeText(loadedPayoutAccount.bank_code, ""));
          setBankName(safeText(loadedPayoutAccount.bank_name, ""));
          setAccountName(safeText(loadedPayoutAccount.account_name, ""));
          setAccountNumber("");
          setAccountNumberMasked(safeText(loadedPayoutAccount.account_number_masked, ""));
          setRecipientCode(safeText(loadedPayoutAccount.recipient_code, ""));
          setCurrencyInput(safeText(loadedPayoutAccount.currency, "NGN"));
          setIsVerified(Boolean(loadedPayoutAccount.is_verified));
        } else {
          setProvider("paystack");
          setBankCode("");
          setBankName("");
          setAccountName("");
          setAccountNumber("");
          setAccountNumberMasked("");
          setRecipientCode("");
          setCurrencyInput("NGN");
          setIsVerified(false);
        }
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
    },
    [requireAuth]
  );

  useEffect(() => {
    if (!authReady) return;
    void loadAll(false);
  }, [authReady, loadAll]);

  const profile = meData?.summary?.profile || meData?.profile || null;
  const totals = meData?.summary?.totals || {};
  const recentReferrals = historyData?.rows || meData?.summary?.recent_referrals || [];
  const recentRewards = rewardsData?.rows || meData?.summary?.recent_rewards || [];
  const recentPayouts = payoutsData?.rows || meData?.summary?.recent_payouts || [];
  const payoutAccount =
    meData?.payout_account || meData?.payout_eligibility?.payout_account || null;
  const eligibility = meData?.payout_eligibility || null;

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

  const requestPayoutBlockReason = useMemo(() => {
    if (!eligibility) {
      return "Payout eligibility is not available yet.";
    }

    if (!eligibility.has_payout_account && !payoutAccount) {
      return "Save a payout account first.";
    }

    if (eligibility.requires_verified_account && !eligibility.is_verified) {
      return "Verify the payout account before requesting a payout.";
    }

    if (safeNumber(eligibility.open_payout_count, 0) > 0) {
      return "You already have a pending or processing payout request.";
    }

    if (safeNumber(eligibility.available_amount, 0) <= 0) {
      return "No approved referral balance is available for payout.";
    }

    if (!eligibility.minimum_reached) {
      return `Minimum payout is ${formatMoney(eligibility.minimum_amount, currency)}.`;
    }

    if (!eligibility.eligible) {
      return "Payout is not currently eligible.";
    }

    return "";
  }, [currency, eligibility, payoutAccount]);

  const savePayoutAccountDisabled =
    savingAccount || !provider.trim() || !currencyInput.trim();

  const requestPayoutDisabled = requestingPayout || Boolean(requestPayoutBlockReason);

  async function handleSavePayoutAccount() {
    if (!requireAuth()) return;

    setSavingAccount(true);
    setNotice(null);

    try {
      const response = await apiJson<{
        ok?: boolean;
        payout_account?: PayoutAccount | null;
        payout_eligibility?: PayoutEligibility | null;
      }>("/referrals/payout-account", {
        method: "POST",
        body: {
          provider: provider.trim() || "paystack",
          bank_code: bankCode.trim() || undefined,
          bank_name: bankName.trim() || undefined,
          account_name: accountName.trim() || undefined,
          account_number: accountNumber.trim() || undefined,
          account_number_masked: accountNumberMasked.trim() || undefined,
          recipient_code: recipientCode.trim() || undefined,
          currency: currencyInput.trim() || "NGN",
          is_verified: isVerified,
        },
        useAuthToken: false,
        timeoutMs: 15000,
      });

      setNotice({
        tone: "good",
        title: "Payout account saved",
        subtitle: `Provider: ${safeText(
          response?.payout_account?.provider,
          "paystack"
        )} • Verified: ${response?.payout_account?.is_verified ? "Yes" : "No"}`,
      });

      setAccountNumber("");
      await loadAll(true);
    } catch (e: unknown) {
      if (isApiError(e)) {
        setNotice({
          tone: "danger",
          title: "Could not save payout account",
          subtitle: safeText(
            e.data?.root_cause || e.data?.error || e.message,
            "Unknown error"
          ),
        });
      } else if (e instanceof Error) {
        setNotice({
          tone: "danger",
          title: "Could not save payout account",
          subtitle: e.message,
        });
      } else {
        setNotice({
          tone: "danger",
          title: "Could not save payout account",
          subtitle: "Unknown error",
        });
      }
    } finally {
      setSavingAccount(false);
    }
  }

  async function handleRequestPayout() {
    if (!requireAuth()) return;
    if (requestPayoutBlockReason) {
      setNotice({
        tone: "warn",
        title: "Payout is not ready",
        subtitle: requestPayoutBlockReason,
      });
      return;
    }

    setRequestingPayout(true);
    setNotice(null);

    try {
      const body: Record<string, unknown> = {
        provider: provider.trim() || undefined,
        provider_reference: payoutProviderReference.trim() || undefined,
        provider_transfer_code: payoutTransferCode.trim() || undefined,
      };

      if (payoutAmount.trim()) {
        body.amount = Number(payoutAmount);
      }

      const response = await apiJson<{
        ok?: boolean;
        payout?: PayoutRow | null;
      }>("/referrals/payout-request", {
        method: "POST",
        body,
        useAuthToken: false,
        timeoutMs: 15000,
      });

      setNotice({
        tone: "good",
        title: "Payout request submitted",
        subtitle: `A new payout row was created with status ${safeText(
          response?.payout?.status,
          "pending"
        )}.`,
      });

      setPayoutAmount("");
      setPayoutProviderReference("");
      setPayoutTransferCode("");

      await loadAll(true);
    } catch (e: unknown) {
      if (isApiError(e)) {
        setNotice({
          tone: "danger",
          title: "Could not request payout",
          subtitle: safeText(
            e.data?.root_cause || e.data?.error || e.message,
            "Unknown error"
          ),
        });
      } else if (e instanceof Error) {
        setNotice({
          tone: "danger",
          title: "Could not request payout",
          subtitle: e.message,
        });
      } else {
        setNotice({
          tone: "danger",
          title: "Could not request payout",
          subtitle: "Unknown error",
        });
      }
    } finally {
      setRequestingPayout(false);
    }
  }

  return (
    <AppShell
      title="Referrals"
      subtitle="View your referral code, manage your payout account, check eligibility, and request referral payouts from one workspace."
      actions={
        <>
          <button
            type="button"
            onClick={() => void loadAll(true)}
            disabled={refreshing}
            aria-disabled={refreshing}
            style={buttonStyleWithDisabledState(shellButtonPrimary(), refreshing)}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            onClick={() => void copyText(referralCode, "Referral code")}
            style={shellButtonSecondary()}
          >
            Copy Code
          </button>

          <button
            type="button"
            onClick={() => void copyText(referralLink, "Referral link")}
            style={shellButtonSecondary()}
          >
            Copy Link
          </button>

          <button
            type="button"
            onClick={() => openWhatsAppShare(inviteMessage)}
            style={shellButtonSecondary()}
          >
            Share WhatsApp
          </button>

          <button
            type="button"
            onClick={() => openTelegramShare(inviteMessage)}
            style={shellButtonSecondary()}
          >
            Share Telegram
          </button>
        </>
      }
    >
      <div style={{ display: "grid", gap: 20 }}>
        {notice ? (
          <div
            style={{
              ...cardStyle(),
              ...toneStyle(notice.tone),
            }}
          >
            <div style={sectionTitleStyle()}>{notice.title}</div>
            <div style={mutedStyle()}>{notice.subtitle}</div>
          </div>
        ) : null}

        {loading ? (
          <div style={cardStyle()}>
            <div style={sectionTitleStyle()}>Loading referral workspace...</div>
            <div style={mutedStyle()}>
              Please wait while your referral profile, counts, rewards, payout
              account, and payout eligibility are being loaded.
            </div>
          </div>
        ) : null}

        {!loading && errorText ? (
          <div style={cardStyle()}>
            <div style={sectionTitleStyle()}>Referral page could not load</div>
            <div style={{ ...mutedStyle(), color: "#fca5a5" }}>{errorText}</div>
            <div style={mutedStyle()}>
              The backend referral routes are already in place. Any remaining
              issue should now be limited to response data or environment wiring.
            </div>
          </div>
        ) : null}

        {!loading && !errorText ? (
          <>
            <div style={twoColumnGridStyle()}>
              <div style={cardStyle()}>
                <div style={sectionTitleStyle()}>Your referral profile</div>
                <div style={mutedStyle()}>
                  Share your referral code or invite link to bring new users into
                  Naija Tax Guide.
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  <div style={statCardStyle()}>
                    <div style={labelStyle()}>Referral Code</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: "var(--text)" }}>
                      {referralCode}
                    </div>
                  </div>

                  <div style={statCardStyle()}>
                    <div style={labelStyle()}>Referral Link</div>
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
                    <div style={labelStyle()}>Ready-to-share invite message</div>
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
                </div>
              </div>

              <div style={cardStyle()}>
                <div style={sectionTitleStyle()}>Status summary</div>
                <div style={mutedStyle()}>
                  Quick view of totals, reward balances, and payout readiness.
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: 12,
                  }}
                >
                  {statItems.map((item) => (
                    <div key={item.label} style={statCardStyle()}>
                      <div style={labelStyle()}>{item.label}</div>
                      <div style={valueStyle()}>{item.value}</div>
                      <div style={mutedStyle()}>{item.helper}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={twoColumnGridStyle()}>
              <div style={cardStyle()}>
                <div style={sectionTitleStyle()}>Payout account</div>
                <div style={mutedStyle()}>
                  Save the payout destination details the backend will use when
                  creating your payout requests.
                </div>

                <div style={statCardStyle()}>
                  <div style={labelStyle()}>Current saved payout account</div>
                  <div style={mutedStyle()}>
                    Provider: {safeText(payoutAccount?.provider, "None")} • Bank:{" "}
                    {safeText(payoutAccount?.bank_name, "None")}
                  </div>
                  <div style={mutedStyle()}>
                    Account Name: {safeText(payoutAccount?.account_name, "None")}
                  </div>
                  <div style={mutedStyle()}>
                    Account Number:{" "}
                    {safeText(payoutAccount?.account_number_masked, "None")}
                  </div>
                  <div style={mutedStyle()}>
                    Recipient Code: {safeText(payoutAccount?.recipient_code, "None")} •
                    Verified: {payoutAccount?.is_verified ? " Yes" : " No"}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={labelStyle()}>Provider</div>
                    <input
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      style={inputStyle()}
                      placeholder="paystack"
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ display: "grid", gap: 6 }}>
                      <div style={labelStyle()}>Bank Code</div>
                      <input
                        value={bankCode}
                        onChange={(e) => setBankCode(e.target.value)}
                        style={inputStyle()}
                        placeholder="058"
                      />
                    </div>

                    <div style={{ display: "grid", gap: 6 }}>
                      <div style={labelStyle()}>Bank Name</div>
                      <input
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        style={inputStyle()}
                        placeholder="GTBank"
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={labelStyle()}>Account Name</div>
                    <input
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      style={inputStyle()}
                      placeholder="Full account name"
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ display: "grid", gap: 6 }}>
                      <div style={labelStyle()}>Account Number</div>
                      <input
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        style={inputStyle()}
                        placeholder="0123456789"
                      />
                    </div>

                    <div style={{ display: "grid", gap: 6 }}>
                      <div style={labelStyle()}>Account Number Masked</div>
                      <input
                        value={accountNumberMasked}
                        onChange={(e) => setAccountNumberMasked(e.target.value)}
                        style={inputStyle()}
                        placeholder="****6789"
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ display: "grid", gap: 6 }}>
                      <div style={labelStyle()}>Recipient Code</div>
                      <input
                        value={recipientCode}
                        onChange={(e) => setRecipientCode(e.target.value)}
                        style={inputStyle()}
                        placeholder="RCP-123"
                      />
                    </div>

                    <div style={{ display: "grid", gap: 6 }}>
                      <div style={labelStyle()}>Currency</div>
                      <input
                        value={currencyInput}
                        onChange={(e) => setCurrencyInput(e.target.value)}
                        style={inputStyle()}
                        placeholder="NGN"
                      />
                    </div>
                  </div>

                  <label
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      color: "var(--text)",
                      fontWeight: 700,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isVerified}
                      onChange={(e) => setIsVerified(e.target.checked)}
                    />
                    Mark payout account as verified
                  </label>

                  <div>
                    <button
                      type="button"
                      onClick={() => void handleSavePayoutAccount()}
                      disabled={savePayoutAccountDisabled}
                      aria-disabled={savePayoutAccountDisabled}
                      style={buttonStyleWithDisabledState(
                        shellButtonPrimary(),
                        savePayoutAccountDisabled
                      )}
                    >
                      {savingAccount ? "Saving..." : "Save Payout Account"}
                    </button>
                  </div>
                </div>
              </div>

              <div style={cardStyle()}>
                <div style={sectionTitleStyle()}>Payout eligibility and request</div>
                <div style={mutedStyle()}>
                  Check whether your approved reward balance is currently eligible
                  for payout, then create a payout request.
                </div>

                <div style={statCardStyle()}>
                  <div style={labelStyle()}>Eligibility snapshot</div>
                  <div style={mutedStyle()}>
                    Eligible: {eligibility?.eligible ? "Yes" : "No"} • Verified
                    account: {eligibility?.is_verified ? "Yes" : "No"}
                  </div>
                  <div style={mutedStyle()}>
                    Available amount: {formatMoney(eligibility?.available_amount, currency)}
                  </div>
                  <div style={mutedStyle()}>
                    Minimum amount: {formatMoney(eligibility?.minimum_amount, currency)}
                  </div>
                  <div style={mutedStyle()}>
                    Open payout amount:{" "}
                    {formatMoney(eligibility?.open_payout_amount, currency)}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={labelStyle()}>Payout Amount</div>
                    <input
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      style={inputStyle()}
                      placeholder="Leave blank to request full available amount"
                    />
                  </div>

                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={labelStyle()}>Provider Reference</div>
                    <input
                      value={payoutProviderReference}
                      onChange={(e) => setPayoutProviderReference(e.target.value)}
                      style={inputStyle()}
                      placeholder="Optional provider reference"
                    />
                  </div>

                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={labelStyle()}>Transfer Code</div>
                    <input
                      value={payoutTransferCode}
                      onChange={(e) => setPayoutTransferCode(e.target.value)}
                      style={inputStyle()}
                      placeholder="Optional transfer code"
                    />
                  </div>

                  {requestPayoutBlockReason ? (
                    <div
                      style={{
                        ...statCardStyle(),
                        border: "1px solid rgba(245,158,11,0.25)",
                        background: "rgba(245,158,11,0.08)",
                      }}
                    >
                      <div style={labelStyle()}>Request status</div>
                      <div style={mutedStyle()}>{requestPayoutBlockReason}</div>
                    </div>
                  ) : null}

                  <div>
                    <button
                      type="button"
                      onClick={() => void handleRequestPayout()}
                      disabled={requestPayoutDisabled}
                      aria-disabled={requestPayoutDisabled}
                      style={buttonStyleWithDisabledState(
                        shellButtonPrimary(),
                        requestPayoutDisabled
                      )}
                    >
                      {requestingPayout ? "Submitting..." : "Request Payout"}
                    </button>
                  </div>
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

            <div style={twoColumnGridStyle()}>
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
                          {safeText(row.reward_type)} — {currency}{" "}
                          {safeText(row.reward_amount, "0")}
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
                          Status: {safeText(row.status)} • Provider:{" "}
                          {safeText(row.provider)}
                        </div>
                        <div style={mutedStyle()}>
                          Reference: {safeText(row.provider_reference, "None")} •
                          Transfer code: {safeText(row.provider_transfer_code, "None")}
                        </div>
                        {row.failure_reason ? (
                          <div style={mutedStyle()}>
                            Failure: {safeText(row.failure_reason)}
                          </div>
                        ) : null}
                        <div style={mutedStyle()}>
                          Created: {formatDate(row.requested_at || row.created_at)}
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
