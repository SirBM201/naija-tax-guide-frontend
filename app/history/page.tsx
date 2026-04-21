'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { apiJson, isApiError } from '@/lib/api';
import { CONFIG } from '@/lib/config';
import AppShell from '@/components/app-shell';
import WorkspaceActionBar from '@/components/workspace-action-bar';
import WorkspaceSectionCard from '@/components/workspace-section-card';
import {
  Banner,
  MetricCard,
  ShortcutCard,
  appInputStyle,
  appSelectStyle,
  formatDate,
} from '@/components/ui';
import { CardsGrid, SectionStack, TwoColumnSection } from '@/components/page-layout';
import WorkspaceOverviewMetrics from '@/components/workspace-overview-metrics';
import { useWorkspaceState } from '@/hooks/useWorkspaceState';
import { getHistoryItems, type HistoryItem as LocalHistoryItem } from '@/lib/history-storage';

type HistoryTab = 'qa' | 'filings';

type BackendHistoryItem = {
  id?: string;
  account_id?: string;
  question?: string;
  answer?: string;
  lang?: string;
  source?: string;
  from_cache?: boolean;
  canonical_key?: string | null;
  normalized_question?: string | null;
  plan_code?: string | null;
  credits_consumed?: number;
  usage_charged?: boolean;
  channel?: string | null;
  created_at?: string;
  updated_at?: string;
};

type DisplayHistoryItem = {
  id: string;
  question: string;
  answer: string;
  language: string;
  source: string;
  created_at: string;
  from_cache?: boolean;
};

type FilingRecord = {
  id: string;
  taxType: string;
  inputs: any;
  documents: any[];
  userId: string;
  status: string;
  submittedAt: string;
};

type HistoryStats = {
  ok?: boolean;
  backend_history_available?: boolean;
  continuity_state?: string;
  daily_usage?: number;
  expires_at?: string | null;
  filtered_results?: number;
  newest_item?: string | null;
  oldest_item?: string | null;
  saved_items?: number;
  source_counts?: {
    web?: number;
    whatsapp?: number;
    telegram?: number;
  };
  storage_mode?: string;
};

type HistoryApiResponse = {
  ok: boolean;
  items?: BackendHistoryItem[];
  history?: BackendHistoryItem[];
  results?: BackendHistoryItem[];
  count?: number;
  total?: number;
  limit?: number;
  offset?: number;
  account_id?: string;
  backend_history_available?: boolean;
  fallback_mode?: boolean;
  storage_mode?: string;
  stats?: HistoryStats;
  summary?: HistoryStats;
  error?: string;
  message?: string;
  root_cause?: string;
};

type HistoryHealthResponse = {
  ok?: boolean;
  backend_history_available?: boolean;
  storage_mode?: string;
  table?: string;
  error?: string;
  message?: string;
  root_cause?: string;
};

type NoticeTone = 'good' | 'warn' | 'danger' | 'default';

type HistoryNotice = {
  title: string;
  subtitle: string;
  tone: NoticeTone;
};

type PageAlert = {
  title: string;
  subtitle: string;
  tone: NoticeTone;
};

type HistoryMode = 'backend' | 'local';

function buildAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};

  if (typeof window !== 'undefined') {
    const token = (window.localStorage.getItem('nt_access_token') || '').trim();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
}

function apiRoot(): string {
  return String(CONFIG.apiBase || '').trim().replace(/\/+$/, '');
}

async function fetchHistoryHealth(): Promise<HistoryHealthResponse> {
  try {
    return await apiJson<HistoryHealthResponse>('/history/health', {
      method: 'GET',
      timeoutMs: 15000,
      useAuthToken: false,
    });
  } catch (err: unknown) {
    if (isApiError(err)) {
      return {
        ok: false,
        error: String(err.data?.error || 'history_health_failed'),
        message:
          String(err.data?.message || err.data?.root_cause || err.message || '').trim() ||
          'History health check failed.',
        root_cause: String(err.data?.root_cause || '').trim() || undefined,
      };
    }

    return {
      ok: false,
      error: 'history_health_failed',
      message: err instanceof Error ? err.message : 'History health check failed.',
    };
  }
}

function extractBackendItems(data: HistoryApiResponse | null | undefined): BackendHistoryItem[] {
  if (!data) return [];
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.history)) return data.history;
  if (Array.isArray(data.results)) return data.results;
  return [];
}

async function fetchHistoryItems(params: {
  accountId: string;
  source?: string;
  q?: string;
  limit?: number;
}): Promise<HistoryApiResponse> {
  if (!String(params.accountId || '').trim()) {
    return {
      ok: false,
      error: 'missing_account_id',
      message: 'No account ID is available yet for backend history lookup.',
    };
  }

  try {
    return await apiJson<HistoryApiResponse>('/history/items', {
      method: 'GET',
      timeoutMs: 20000,
      useAuthToken: false,
      query: {
        account_id: params.accountId,
        source: params.source && params.source !== 'all' ? params.source : undefined,
        q: params.q?.trim() || undefined,
        limit: params.limit || 50,
      },
    });
  } catch (err: unknown) {
    if (isApiError(err)) {
      return {
        ok: false,
        error: String(err.data?.error || 'history_fetch_failed'),
        message:
          String(err.data?.message || err.data?.root_cause || err.message || '').trim() ||
          'History fetch failed.',
        root_cause: String(err.data?.root_cause || '').trim() || undefined,
      };
    }

    return {
      ok: false,
      error: 'history_fetch_failed',
      message: err instanceof Error ? err.message : 'History fetch failed.',
    };
  }
}

async function deleteBackendHistoryItem(id: string, accountId: string): Promise<boolean> {
  const headers = buildAuthHeaders();
  const root = apiRoot();

  if (!root) return false;

  const candidates = [
    `${root}/history/${encodeURIComponent(id)}?account_id=${encodeURIComponent(accountId)}`,
    `${root}/history/item/${encodeURIComponent(id)}?account_id=${encodeURIComponent(accountId)}`,
    `${root}/history?id=${encodeURIComponent(id)}&account_id=${encodeURIComponent(accountId)}`,
  ];

  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      if (res.ok) return true;
    } catch {
      // try next candidate
    }
  }

  return false;
}

async function clearBackendHistory(accountId: string): Promise<boolean> {
  const headers = buildAuthHeaders();
  const root = apiRoot();

  if (!root) return false;

  const candidates = [
    `${root}/history/clear?account_id=${encodeURIComponent(accountId)}`,
    `${root}/history?all=1&account_id=${encodeURIComponent(accountId)}`,
  ];

  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      if (res.ok) return true;
    } catch {
      // try next candidate
    }
  }

  return false;
}

function truncateText(value: string, max = 180) {
  const text = String(value || '').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

function sourceLabel(source?: string) {
  const v = String(source || '').toLowerCase();
  if (v === 'web') return 'Web';
  if (v === 'whatsapp') return 'WhatsApp';
  if (v === 'telegram') return 'Telegram';
  if (v === 'cache') return 'Cache';
  if (v === 'ai') return 'AI';
  return 'Unknown';
}

function languageLabel(language?: string) {
  const v = String(language || '').trim();
  if (!v) return 'English';

  const lower = v.toLowerCase();
  if (lower === 'en') return 'English';
  if (lower === 'pcm') return 'Pidgin';
  if (lower === 'yo') return 'Yoruba';
  if (lower === 'ig') return 'Igbo';
  if (lower === 'ha') return 'Hausa';

  return v;
}

function toneFromHistoryCount(count: number): 'good' | 'warn' | 'default' {
  if (count >= 5) return 'good';
  if (count >= 1) return 'warn';
  return 'default';
}

function mapBackendItem(row: BackendHistoryItem, index: number): DisplayHistoryItem {
  return {
    id: String(row.id || `${row.created_at || 'history'}-${index}`),
    question: String(row.question || '').trim(),
    answer: String(row.answer || '').trim(),
    language: languageLabel(String(row.lang || 'English')),
    source: String(row.source || 'web'),
    created_at: String(row.created_at || row.updated_at || ''),
    from_cache: Boolean(row.from_cache),
  };
}

function mapLocalItem(row: LocalHistoryItem, index: number): DisplayHistoryItem {
  return {
    id: String(row.id || `${row.created_at || 'local'}-${index}`),
    question: String(row.question || '').trim(),
    answer: String(row.answer || '').trim(),
    language: languageLabel(String(row.language || 'English')),
    source: String(row.source || 'web'),
    created_at: String(row.created_at || ''),
  };
}

function readLocalHistoryItems(): DisplayHistoryItem[] {
  try {
    return getHistoryItems().map(mapLocalItem);
  } catch {
    return [];
  }
}

function looksLikeHistoryArray(value: unknown): value is Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return false;
  return value.every((row) => {
    if (!row || typeof row !== 'object') return false;
    const item = row as Record<string, unknown>;
    return (
      typeof item.question === 'string' &&
      typeof item.answer === 'string' &&
      typeof item.created_at === 'string'
    );
  });
}

function findHistoryStorageKey(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key) continue;

      const raw = window.localStorage.getItem(key);
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw) as unknown;
        if (looksLikeHistoryArray(parsed)) {
          return key;
        }
      } catch {
        // ignore non-json values
      }
    }
  } catch {
    return null;
  }

  return null;
}

function persistLocalHistoryItems(items: DisplayHistoryItem[]): boolean {
  if (typeof window === 'undefined') return false;

  const key = findHistoryStorageKey();
  if (!key) return false;

  const payload: LocalHistoryItem[] = items.map((item) => ({
    id: item.id,
    question: item.question,
    answer: item.answer,
    language: item.language,
    created_at: item.created_at,
    source: item.source,
  }));

  try {
    window.localStorage.setItem(key, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

function actionButtonStyle(
  tone: 'default' | 'primary' | 'danger' = 'default'
): React.CSSProperties {
  const tones: Record<string, React.CSSProperties> = {
    default: {
      border: '1px solid var(--border-strong)',
      background: 'var(--button-bg)',
      color: 'var(--text)',
    },
    primary: {
      border: '1px solid var(--brand-border)',
      background: 'var(--button-bg)',
      color: 'var(--text)',
    },
    danger: {
      border: '1px solid rgba(176, 77, 77, 0.35)',
      background: 'rgba(176, 77, 77, 0.08)',
      color: 'var(--text)',
    },
  };

  return {
    width: '100%',
    minHeight: 46,
    padding: '12px 16px',
    borderRadius: 14,
    fontWeight: 900,
    cursor: 'pointer',
    fontSize: 14,
    lineHeight: 1.3,
    textAlign: 'center',
    ...tones[tone],
  };
}

function sectionLabelStyle(): React.CSSProperties {
  return {
    color: 'var(--text)',
    fontWeight: 800,
    fontSize: 14,
  };
}

function actionGridStyle(minWidth = 180): React.CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fit,minmax(${minWidth}px,1fr))`,
    gap: 10,
    width: '100%',
  };
}

function HistoryItemCard({
  item,
  expanded,
  actionBusy,
  onToggle,
  onOpenInAsk,
  onCopyQuestion,
  onDelete,
}: {
  item: DisplayHistoryItem;
  expanded: boolean;
  actionBusy: boolean;
  onToggle: () => void;
  onOpenInAsk: () => void;
  onCopyQuestion: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      style={{
        borderRadius: 22,
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        padding: 18,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr)',
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              color: 'var(--gold)',
              fontWeight: 900,
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.45,
              lineHeight: 1.5,
              wordBreak: 'break-word',
            }}
          >
            {sourceLabel(item.source)} • {languageLabel(item.language)}
            {item.from_cache ? ' • Cache-assisted' : ''}
          </div>

          <div
            style={{
              marginTop: 10,
              color: 'var(--text)',
              fontWeight: 900,
              fontSize: 'clamp(16px, 2.8vw, 18px)',
              lineHeight: 1.55,
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
            }}
          >
            {expanded
              ? String(item.question || 'Untitled question')
              : truncateText(String(item.question || 'Untitled question'), 140)}
          </div>
        </div>

        <div
          style={{
            color: 'var(--text-faint)',
            fontSize: 13,
            lineHeight: 1.5,
            overflowWrap: 'anywhere',
          }}
        >
          {formatDate(item.created_at)}
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          borderRadius: 18,
          border: '1px solid var(--border)',
          background: 'var(--surface-soft)',
          padding: 16,
          minWidth: 0,
        }}
      >
        <div
          style={{
            color: 'var(--text-faint)',
            fontSize: 12,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: 0.35,
          }}
        >
          Answer
        </div>
        <div
          style={{
            marginTop: 10,
            color: 'var(--text-muted)',
            lineHeight: 1.75,
            fontSize: 14,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
          }}
        >
          {expanded
            ? String(item.answer || 'No saved answer.')
            : truncateText(String(item.answer || 'No saved answer.'), 320)}
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          display: 'grid',
          gap: 14,
          alignItems: 'start',
        }}
      >
        <div
          style={{
            color: 'var(--text-faint)',
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          Saved item available for continuity, follow-up, and user review.
        </div>

        <div style={actionGridStyle(165)}>
          <button onClick={onToggle} style={actionButtonStyle('default')}>
            {expanded ? 'Show Less' : 'Open Full Item'}
          </button>

          <button
            onClick={onOpenInAsk}
            disabled={actionBusy}
            style={{
              ...actionButtonStyle('primary'),
              opacity: actionBusy ? 0.6 : 1,
            }}
          >
            Reopen in Ask
          </button>

          <button
            onClick={onCopyQuestion}
            disabled={actionBusy}
            style={{
              ...actionButtonStyle('default'),
              opacity: actionBusy ? 0.6 : 1,
            }}
          >
            Copy Question
          </button>

          <button
            onClick={onDelete}
            disabled={actionBusy}
            style={{
              ...actionButtonStyle('danger'),
              opacity: actionBusy ? 0.6 : 1,
            }}
          >
            {actionBusy ? 'Deleting...' : 'Delete Item'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const router = useRouter();
  const { refreshSession, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<HistoryTab>('qa');
  const [historyItems, setHistoryItems] = useState<DisplayHistoryItem[]>([]);
  const [filings, setFilings] = useState<FilingRecord[]>([]);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingFilings, setLoadingFilings] = useState(false);
  const [historyNotice, setHistoryNotice] = useState<HistoryNotice | null>(null);
  const [historyMode, setHistoryMode] = useState<HistoryMode>('local');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

  const {
    busy,
    status,
    load,
    accountId,
    activeNow,
    planCode,
    creditBalance,
    dailyUsage,
    dailyLimit,
    expiresAt,
    pendingPlanCode,
    pendingStartsAt,
  } = useWorkspaceState({
    refreshSession,
    autoLoad: false,
    includeAccount: true,
    includeBilling: true,
    includeDebug: true,
    loadingMessage: 'Loading history workspace...',
  });

  const fallbackToLocalHistory = useCallback((notice?: HistoryNotice) => {
    const localItems = readLocalHistoryItems();
    setHistoryItems(localItems);
    setHistoryMode('local');
    if (notice) {
      setHistoryNotice(notice);
    }
  }, []);

  const refreshHistoryFromBackend = useCallback(
    async (nextSearch?: string, nextSource?: string, suppressMissingAccountNotice = false) => {
      setLoadingHistory(true);
      setHistoryNotice(null);

      try {
        const health = await fetchHistoryHealth();

        if (!health.ok || health.backend_history_available !== true) {
          fallbackToLocalHistory({
            title: 'Backend history unavailable',
            subtitle: String(
              health.message ||
                health.root_cause ||
                'Falling back to local history storage because backend history is not yet fully available.'
            ).trim(),
            tone: 'warn',
          });
          return;
        }

        const effectiveAccountId = String(accountId || '').trim();

        if (!effectiveAccountId) {
          fallbackToLocalHistory(
            suppressMissingAccountNotice
              ? undefined
              : {
                  title: 'History account not ready',
                  subtitle:
                    'The workspace account is still loading, so backend history cannot be read yet. Refresh again after account details are ready.',
                  tone: 'warn',
                }
          );
          return;
        }

        const result = await fetchHistoryItems({
          accountId: effectiveAccountId,
          source: nextSource ?? sourceFilter,
          q: nextSearch ?? search.trim(),
          limit: 50,
        });

        const rows = extractBackendItems(result);
        const backendStorage = String(
          result.storage_mode || result.summary?.storage_mode || health.storage_mode || ''
        )
          .trim()
          .toLowerCase() === 'backend';

        if (result.ok && backendStorage) {
          setHistoryItems(rows.map(mapBackendItem));
          setHistoryMode('backend');
          return;
        }

        fallbackToLocalHistory({
          title: 'Backend history unavailable',
          subtitle: String(
            result.message ||
              result.root_cause ||
              'Falling back to local history storage because backend history is not yet fully available.'
          ).trim(),
          tone: 'warn',
        });
      } catch (err: unknown) {
        fallbackToLocalHistory({
          title: 'History fallback in use',
          subtitle:
            err instanceof Error
              ? err.message
              : 'A backend history error occurred, so local history storage is being shown instead.',
          tone: 'warn',
        });
      } finally {
        setLoadingHistory(false);
      }
    },
    [accountId, fallbackToLocalHistory, search, sourceFilter]
  );

  const fetchFilings = useCallback(async () => {
    setLoadingFilings(true);
    try {
      const effectiveAccountId = String(accountId || '').trim();
      const res = await apiJson('/api/tax/file', {
        method: 'GET',
        query: effectiveAccountId ? { userId: effectiveAccountId } : undefined,
        timeoutMs: 10000,
      });
      if (res.ok && Array.isArray(res.filings)) {
        setFilings(res.filings);
      } else {
        setFilings([]);
      }
    } catch (err) {
      console.error('Failed to fetch filings:', err);
      setFilings([]);
    } finally {
      setLoadingFilings(false);
    }
  }, [accountId]);

  const loadHistoryWorkspace = useCallback(
    async (message = 'Loading history workspace...') => {
      await load(message);

      if (String(accountId || '').trim()) {
        await refreshHistoryFromBackend();
      }
    },
    [load, accountId, refreshHistoryFromBackend]
  );

  useEffect(() => {
    void loadHistoryWorkspace();
  }, [loadHistoryWorkspace]);

  useEffect(() => {
    if (!String(accountId || '').trim()) return;
    void refreshHistoryFromBackend(undefined, undefined, true);
  }, [accountId, refreshHistoryFromBackend]);

  useEffect(() => {
    if (activeTab === 'filings' && accountId) {
      void fetchFilings();
    }
  }, [activeTab, accountId, fetchFilings]);

  const alerts = useMemo<PageAlert[]>(() => {
    const items: PageAlert[] = [];

    if (status) {
      items.push({
        title: 'Current history workspace status',
        subtitle: status,
        tone: 'default',
      });
    }

    if (!activeNow) {
      items.push({
        title: 'Subscription attention needed',
        subtitle:
          'Your subscription does not currently appear active. Some fresh AI actions may be restricted until billing is restored.',
        tone: 'warn',
      });
    }

    if (creditBalance <= 0) {
      items.push({
        title: 'Credit balance is empty',
        subtitle:
          'No visible AI credits are available right now. History remains accessible, but fresh AI actions may fail.',
        tone: 'warn',
      });
    }

    if (dailyLimit > 0 && dailyUsage >= dailyLimit) {
      items.push({
        title: 'Daily limit reached',
        subtitle:
          'You have reached the visible daily usage limit for today. Review your plan or wait for reset.',
        tone: 'warn',
      });
    }

    if (pendingPlanCode) {
      items.push({
        title: 'Pending plan change detected',
        subtitle: pendingStartsAt
          ? `A pending plan change to ${pendingPlanCode} is scheduled for ${formatDate(
              pendingStartsAt
            )}.`
          : `A pending plan change to ${pendingPlanCode} is scheduled.`,
        tone: 'default',
      });
    }

    return items;
  }, [
    status,
    activeNow,
    creditBalance,
    dailyLimit,
    dailyUsage,
    pendingPlanCode,
    pendingStartsAt,
  ]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();

    return historyItems.filter((item) => {
      const matchesSource =
        sourceFilter === 'all' ? true : String(item.source || '').toLowerCase() === sourceFilter;

      if (!matchesSource) return false;
      if (!term) return true;

      const question = String(item.question || '').toLowerCase();
      const answer = String(item.answer || '').toLowerCase();
      const language = String(item.language || '').toLowerCase();
      const source = String(item.source || '').toLowerCase();

      return (
        question.includes(term) ||
        answer.includes(term) ||
        language.includes(term) ||
        source.includes(term)
      );
    });
  }, [historyItems, search, sourceFilter]);

  const webCount = historyItems.filter(
    (item) => String(item.source || '').toLowerCase() === 'web'
  ).length;

  const whatsappCount = historyItems.filter(
    (item) => String(item.source || '').toLowerCase() === 'whatsapp'
  ).length;

  const telegramCount = historyItems.filter(
    (item) => String(item.source || '').toLowerCase() === 'telegram'
  ).length;

  const newestItem = historyItems[0];
  const oldestItem = historyItems[historyItems.length - 1];

  const handleOpenInAsk = (item: DisplayHistoryItem) => {
    const q = encodeURIComponent(item.question || '');
    const lang = encodeURIComponent(languageLabel(item.language || 'English'));
    router.push(`/ask?q=${q}&lang=${lang}`);
  };

  const handleCopyQuestion = async (item: DisplayHistoryItem) => {
    try {
      await navigator.clipboard.writeText(String(item.question || ''));
      setHistoryNotice({
        title: 'Question copied',
        subtitle: 'The selected history question has been copied to your clipboard.',
        tone: 'good',
      });
    } catch {
      setHistoryNotice({
        title: 'Copy could not be completed',
        subtitle:
          'Clipboard access failed in this browser session. You can still reopen the item in Ask.',
        tone: 'warn',
      });
    }
  };

  const handleDeleteItem = async (item: DisplayHistoryItem) => {
    const confirmed = window.confirm(
      'Delete this saved history item? This will remove the selected question and answer from the current history list.'
    );

    if (!confirmed) return;

    setDeletingId(item.id);
    setHistoryNotice(null);

    try {
      if (historyMode === 'backend') {
        const effectiveAccountId = String(accountId || '').trim();

        if (!effectiveAccountId) {
          setHistoryNotice({
            title: 'Account ID not ready',
            subtitle:
              'Backend delete could not continue because the workspace account ID is not available yet.',
            tone: 'warn',
          });
          return;
        }

        const ok = await deleteBackendHistoryItem(item.id, effectiveAccountId);

        if (!ok) {
          setHistoryNotice({
            title: 'Backend delete route not ready',
            subtitle:
              'The page is working, but backend deletion is not yet confirmed for history items. The item was not removed from the server.',
            tone: 'warn',
          });
          return;
        }
      }

      const nextItems = historyItems.filter((row) => row.id !== item.id);
      setHistoryItems(nextItems);

      if (historyMode === 'local') {
        const persisted = persistLocalHistoryItems(nextItems);

        setHistoryNotice({
          title: 'History item deleted',
          subtitle: persisted
            ? 'The selected saved item has been removed successfully.'
            : 'The selected saved item has been removed from the page. Local storage persistence could not be confirmed automatically.',
          tone: persisted ? 'good' : 'warn',
        });
      } else {
        setHistoryNotice({
          title: 'History item deleted',
          subtitle: 'The selected backend history item has been removed successfully.',
          tone: 'good',
        });
      }

      if (expandedId === item.id) {
        setExpandedId(null);
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!historyItems.length) return;

    const confirmed = window.confirm(
      'Clear all visible history items? This action is meant for workspace cleanup.'
    );

    if (!confirmed) return;

    setClearingAll(true);
    setHistoryNotice(null);

    try {
      if (historyMode === 'backend') {
        const effectiveAccountId = String(accountId || '').trim();

        if (!effectiveAccountId) {
          setHistoryNotice({
            title: 'Account ID not ready',
            subtitle:
              'Backend clear-all could not continue because the workspace account ID is not available yet.',
            tone: 'warn',
          });
          return;
        }

        const ok = await clearBackendHistory(effectiveAccountId);

        if (!ok) {
          setHistoryNotice({
            title: 'Backend clear-all route not ready',
            subtitle:
              'The page is working, but backend bulk deletion is not yet confirmed for history items. Nothing was removed from the server.',
            tone: 'warn',
          });
          return;
        }
      }

      setHistoryItems([]);
      setExpandedId(null);

      if (historyMode === 'local') {
        const persisted = persistLocalHistoryItems([]);

        setHistoryNotice({
          title: 'History cleared',
          subtitle: persisted
            ? 'All visible local history items have been cleared successfully.'
            : 'The page has been cleared, but local storage persistence could not be confirmed automatically.',
          tone: persisted ? 'good' : 'warn',
        });
      } else {
        setHistoryNotice({
          title: 'History cleared',
          subtitle: 'All backend history items have been cleared successfully.',
          tone: 'good',
        });
      }
    } finally {
      setClearingAll(false);
    }
  };

  return (
    <AppShell
      title='History'
      subtitle='Review saved tax questions, previous AI answers, and submitted tax filings.'
      actions={
        <WorkspaceActionBar
          items={[
            { label: 'Ask Tax AI', href: '/ask', tone: 'primary' },
            { label: 'Credits', href: '/credits', tone: 'secondary' },
            {
              label: 'Refresh',
              onClick: () => {
                if (activeTab === 'qa') {
                  void loadHistoryWorkspace('Refreshing history workspace...');
                } else {
                  void fetchFilings();
                }
              },
              tone: 'secondary',
              disabled: busy || loadingHistory || loadingFilings || deletingId !== null || clearingAll,
            },
            {
              label: 'Logout',
              onClick: () => {
                void logout();
              },
              tone: 'danger',
              disabled: busy || loadingHistory || loadingFilings || deletingId !== null || clearingAll,
            },
          ]}
        />
      }
    >
      <SectionStack>
        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
          <button
            onClick={() => setActiveTab('qa')}
            style={{
              padding: '10px 24px',
              borderRadius: 40,
              border: 'none',
              background: activeTab === 'qa' ? '#3b82f6' : 'var(--surface-soft)',
              color: activeTab === 'qa' ? 'white' : 'var(--text)',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Q&A History
          </button>
          <button
            onClick={() => setActiveTab('filings')}
            style={{
              padding: '10px 24px',
              borderRadius: 40,
              border: 'none',
              background: activeTab === 'filings' ? '#3b82f6' : 'var(--surface-soft)',
              color: activeTab === 'filings' ? 'white' : 'var(--text)',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Tax Filings
          </button>
        </div>

        {historyNotice ? (
          <Banner
            title={historyNotice.title}
            subtitle={historyNotice.subtitle}
            tone={historyNotice.tone}
          />
        ) : null}

        {alerts.map((alert, index) => (
          <Banner
            key={`${alert.title}-${index}`}
            title={alert.title}
            subtitle={alert.subtitle}
            tone={alert.tone}
          />
        ))}

        <WorkspaceOverviewMetrics
          mode='dashboard'
          accountId={accountId}
          activeNow={activeNow}
          planCode={planCode}
          creditBalance={creditBalance}
          dailyUsage={dailyUsage}
          dailyLimit={dailyLimit}
          expiresAt={expiresAt}
        />

        {/* Q&A History Tab */}
        {activeTab === 'qa' && (
          <>
            <CardsGrid min={200}>
              <MetricCard
                label='Saved Items'
                value={String(historyItems.length)}
                tone={toneFromHistoryCount(historyItems.length)}
                helper='Total visible question-answer items currently saved for this workspace.'
              />
              <MetricCard
                label='Filtered Results'
                value={String(filteredItems.length)}
                tone={filteredItems.length > 0 ? 'good' : 'warn'}
                helper='Visible results after current search and source filter are applied.'
              />
              <MetricCard
                label='Storage Mode'
                value={historyMode === 'backend' ? 'Backend' : 'Local'}
                tone={historyMode === 'backend' ? 'good' : 'warn'}
                helper='Shows whether this page is currently reading server-backed history or local fallback history.'
              />
              <MetricCard
                label='Newest Item'
                value={newestItem ? formatDate(newestItem.created_at) : '—'}
                tone={newestItem ? 'good' : 'default'}
                helper='Most recent saved entry currently visible in history.'
              />
            </CardsGrid>

            <TwoColumnSection leftRatio={1.08} rightRatio={0.92}>
              <WorkspaceSectionCard
                title='History Search'
                subtitle='Find previous questions quickly by keyword or channel source.'
              >
                <div style={{ display: 'grid', gap: 14, minWidth: 0 }}>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <div style={sectionLabelStyle()}>Search saved history</div>
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder='Search question text, answer text, source, or language...'
                      style={appInputStyle()}
                    />
                  </div>

                  <div style={{ display: 'grid', gap: 8 }}>
                    <div style={sectionLabelStyle()}>Filter by source</div>
                    <select
                      value={sourceFilter}
                      onChange={(e) => setSourceFilter(e.target.value)}
                      style={appSelectStyle()}
                    >
                      <option value='all'>All Sources</option>
                      <option value='web'>Web</option>
                      <option value='whatsapp'>WhatsApp</option>
                      <option value='telegram'>Telegram</option>
                      <option value='ai'>AI</option>
                      <option value='cache'>Cache</option>
                    </select>
                  </div>

                  <div style={actionGridStyle(190)}>
                    <button
                      onClick={() => {
                        void refreshHistoryFromBackend(search.trim(), sourceFilter);
                      }}
                      disabled={loadingHistory || busy || deletingId !== null || clearingAll}
                      style={{
                        ...actionButtonStyle('primary'),
                        opacity:
                          loadingHistory || busy || deletingId !== null || clearingAll ? 0.6 : 1,
                      }}
                    >
                      {loadingHistory ? 'Searching...' : 'Apply Search'}
                    </button>

                    <button
                      onClick={handleClearAll}
                      disabled={!historyItems.length || busy || loadingHistory || clearingAll}
                      style={{
                        ...actionButtonStyle('danger'),
                        opacity:
                          !historyItems.length || busy || loadingHistory || clearingAll ? 0.6 : 1,
                      }}
                    >
                      {clearingAll ? 'Clearing...' : 'Clear All History'}
                    </button>
                  </div>

                  <div
                    style={{
                      borderRadius: 18,
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      padding: 16,
                      color: 'var(--text-muted)',
                      lineHeight: 1.75,
                      fontSize: 14,
                    }}
                  >
                    History is part of user continuity. It should help users return to previous tax
                    guidance, compare earlier answers, reopen a saved item back into Ask, and remove
                    items that are no longer useful.
                  </div>
                </div>
              </WorkspaceSectionCard>

              <WorkspaceSectionCard
                title='History Breakdown'
                subtitle='Quick operational view of where saved items came from.'
              >
                <div style={{ display: 'grid', gap: 18 }}>
                  <CardsGrid min={160}>
                    <MetricCard
                      label='Web'
                      value={String(webCount)}
                      tone={webCount > 0 ? 'good' : 'default'}
                      helper='Items saved from the web workspace.'
                    />
                    <MetricCard
                      label='WhatsApp'
                      value={String(whatsappCount)}
                      tone={whatsappCount > 0 ? 'good' : 'default'}
                      helper='Items saved from WhatsApp usage.'
                    />
                    <MetricCard
                      label='Telegram'
                      value={String(telegramCount)}
                      tone={telegramCount > 0 ? 'good' : 'default'}
                      helper='Items saved from Telegram usage.'
                    />
                  </CardsGrid>

                  <MetricCard
                    label='Continuity State'
                    value={historyItems.length > 0 ? 'Available' : 'Empty'}
                    tone={historyItems.length > 0 ? 'good' : 'warn'}
                    helper='Whether the user currently has any saved history to revisit.'
                  />
                </div>
              </WorkspaceSectionCard>
            </TwoColumnSection>

            <WorkspaceSectionCard
              title='Saved Questions and Answers'
              subtitle='Open previous records to continue work with confidence and continuity.'
            >
              {filteredItems.length > 0 ? (
                <div style={{ display: 'grid', gap: 16, minWidth: 0 }}>
                  {filteredItems.map((item) => {
                    const itemId = String(item.id);

                    return (
                      <HistoryItemCard
                        key={itemId}
                        item={item}
                        expanded={expandedId === itemId}
                        actionBusy={deletingId === itemId || clearingAll}
                        onToggle={() => setExpandedId((current) => (current === itemId ? null : itemId))}
                        onOpenInAsk={() => handleOpenInAsk(item)}
                        onCopyQuestion={() => {
                          void handleCopyQuestion(item);
                        }}
                        onDelete={() => {
                          void handleDeleteItem(item);
                        }}
                      />
                    );
                  })}
                </div>
              ) : (
                <Banner
                  title='No matching history found'
                  subtitle={
                    historyItems.length > 0
                      ? 'No saved items match your current search or source filter. Adjust the filters and try again.'
                      : 'No question history is visible yet. Once successful tax questions are saved, they will appear here for future review.'
                  }
                  tone={historyItems.length > 0 ? 'warn' : 'default'}
                />
              )}
            </WorkspaceSectionCard>

            <WorkspaceSectionCard
              title='Recommended Actions'
              subtitle='Use history together with other workspace tools to reduce repeated work.'
            >
              <CardsGrid min={220}>
                <ShortcutCard
                  title='Ask Tax AI'
                  subtitle={
                    !activeNow
                      ? 'Your account may need active paid access before new questions can continue.'
                      : creditBalance <= 0
                        ? 'Your visible credits are exhausted. Review Credits or Plans before continuing.'
                        : 'Ask a new tax question when saved history is no longer enough.'
                  }
                  tone={!activeNow ? 'warn' : creditBalance <= 0 ? 'danger' : 'good'}
                  onClick={() => router.push('/ask')}
                />

                <ShortcutCard
                  title='Credits'
                  subtitle='Review balance and daily usage before deciding whether to continue with fresh AI requests.'
                  tone={creditBalance <= 3 ? 'warn' : 'default'}
                  onClick={() => router.push('/credits')}
                />

                <ShortcutCard
                  title='Billing'
                  subtitle='Check subscription condition, expiry, and billing readiness if access needs attention.'
                  tone={!activeNow ? 'warn' : 'default'}
                  onClick={() => router.push('/billing')}
                />

                <ShortcutCard
                  title='Help Center'
                  subtitle='Open guided help if the user needs assistance interpreting results or workspace behavior.'
                  tone='default'
                  onClick={() => router.push('/help')}
                />
              </CardsGrid>
            </WorkspaceSectionCard>

            <TwoColumnSection>
              <WorkspaceSectionCard
                title='History Notes'
                subtitle='How this page should function in a real SaaS workflow.'
              >
                <div
                  style={{
                    display: 'grid',
                    gap: 10,
                    color: 'var(--text-muted)',
                    fontSize: 14,
                    lineHeight: 1.75,
                  }}
                >
                  <div>1. History should make the product feel continuous, not disposable.</div>
                  <div>2. Users should be able to find earlier answers without friction.</div>
                  <div>3. Search and source filtering reduce repeated questioning.</div>
                  <div>4. Reopen in Ask should let the user continue from any saved item.</div>
                  <div>5. Delete and clear-all should support workspace cleanup.</div>
                </div>
              </WorkspaceSectionCard>

              <WorkspaceSectionCard
                title='Next Best Decision'
                subtitle='Fast summary of what the user should do next.'
              >
                <CardsGrid min={200}>
                  <MetricCard
                    label='Best Immediate Action'
                    value={
                      filteredItems.length > 0
                        ? 'Review or Reopen'
                        : historyItems.length > 0
                          ? 'Adjust Filters'
                          : 'Ask First Question'
                    }
                    tone={
                      filteredItems.length > 0
                        ? 'good'
                        : historyItems.length > 0
                          ? 'warn'
                          : 'default'
                    }
                    helper='Most sensible next move based on current visible history.'
                  />
                  <MetricCard
                    label='History Utility'
                    value={historyItems.length > 0 ? 'Useful' : 'Not Yet Built'}
                    tone={historyItems.length > 0 ? 'good' : 'warn'}
                    helper='Shows whether user continuity is already active in this workspace.'
                  />
                  <MetricCard
                    label='Oldest Item'
                    value={oldestItem ? formatDate(oldestItem.created_at) : '—'}
                    tone={oldestItem ? 'default' : 'warn'}
                    helper='Earliest visible entry still available in history.'
                  />
                </CardsGrid>
              </WorkspaceSectionCard>
            </TwoColumnSection>
          </>
        )}

        {/* Tax Filings Tab */}
        {activeTab === 'filings' && (
          <WorkspaceSectionCard title='Your Tax Filings' subtitle='Submitted tax filings with reference numbers and status.'>
            {loadingFilings ? (
              <div style={{ textAlign: 'center', padding: 40 }}>Loading your filings...</div>
            ) : filings.length === 0 ? (
              <Banner
                title='No filings found'
                subtitle="You haven't submitted any tax filings yet. Use the 'File Taxes' wizard to get started."
                tone='default'
              />
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {filings.map((filing) => (
                  <div
                    key={filing.id}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 18,
                      padding: 18,
                      background: 'var(--surface)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        marginBottom: 12,
                      }}
                    >
                      <strong style={{ fontSize: 18, textTransform: 'uppercase' }}>
                        {filing.taxType} Filing
                      </strong>
                      <span
                        style={{
                          fontSize: 12,
                          background:
                            filing.status === 'submitted'
                              ? 'rgba(16,185,129,0.15)'
                              : 'var(--surface-soft)',
                          padding: '4px 12px',
                          borderRadius: 20,
                          color: filing.status === 'submitted' ? '#10b981' : 'var(--text-muted)',
                        }}
                      >
                        {filing.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                      Reference: <strong>{filing.id}</strong>
                      <br />
                      Submitted: {new Date(filing.submittedAt).toLocaleString()}
                    </div>
                    <details style={{ marginTop: 12 }}>
                      <summary style={{ cursor: 'pointer', fontWeight: 800, fontSize: 14 }}>
                        View filing details
                      </summary>
                      <pre
                        style={{
                          marginTop: 12,
                          padding: 12,
                          background: 'var(--surface-soft)',
                          borderRadius: 12,
                          overflowX: 'auto',
                          fontSize: 12,
                          lineHeight: 1.5,
                        }}
                      >
                        {JSON.stringify(filing.inputs, null, 2)}
                      </pre>
                      {filing.documents && filing.documents.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <strong>Uploaded documents:</strong>
                          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                            {filing.documents.map((doc, idx) => (
                              <li key={idx}>{doc.name} ({(doc.size / 1024).toFixed(1)} KB)</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </details>
                  </div>
                ))}
              </div>
            )}
          </WorkspaceSectionCard>
        )}
      </SectionStack>
    </AppShell>
  );
}
