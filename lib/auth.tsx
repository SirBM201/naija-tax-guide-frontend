"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiJson, isApiError, clearStoredAuthToken } from "@/lib/api";

type AuthUserLike = {
  account_id?: string | null;
  email?: string | null;
  display_name?: string | null;
  phone_e164?: string | null;
};

type AuthDebugValue =
  | string
  | number
  | boolean
  | null
  | Record<string, unknown>
  | unknown[];

type AuthContextValue = {
  token: string | null;
  setToken: (t: string | null) => void;
  hasSession: boolean;
  setHasSession: (v: boolean) => void;
  authReady: boolean;
  logout: () => Promise<void>;
  requireAuth: () => boolean;
  refreshSession: () => Promise<boolean>;
  hasSeenWelcome: boolean;
  setHasSeenWelcome: (v: boolean) => void;
  markWelcomeSeen: () => void;
  lastAuthDebug: AuthDebugValue;
  clearAuthDebug: () => void;
  loading: boolean;
  bypassEnabled: boolean;
  user: AuthUserLike | null;
  me: AuthUserLike | null;
  accountId: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const LS_TOKEN_KEY = "nt_access_token";
const LS_SESSION_KEY = "nt_has_session";
const LS_AUTH_DEBUG_KEY = "nt_auth_debug";
const LS_WELCOME_SEEN_KEY = "ntg-welcome-seen";

type WebMeResp = {
  ok?: boolean;
  account_id?: string;
  email?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  first_name?: string | null;
  phone_e164?: string | null;
  error?: string;
  debug?: unknown;
};

function safeJsonParse(s: string | null): AuthDebugValue {
  if (!s) return null;
  try {
    return JSON.parse(s) as AuthDebugValue;
  } catch {
    return s;
  }
}

function normalizeError(e: unknown) {
  if (isApiError(e)) {
    return {
      kind: "ApiError",
      status: e.status,
      message: e.message,
      data: e.data,
    };
  }

  if (e instanceof Error) {
    return {
      kind: "UnknownError",
      message: e.message,
    };
  }

  return {
    kind: "UnknownError",
    message: String(e),
  };
}

async function probeCookieSession(): Promise<{
  ok: boolean;
  account_id?: string;
  email?: string | null;
  display_name?: string | null;
  phone_e164?: string | null;
  debug?: unknown;
  raw?: unknown;
}> {
  try {
    const data = await apiJson<WebMeResp>("web/auth/me", {
      method: "GET",
      timeoutMs: 12000,
      useAuthToken: false,
    });

    const ok = Boolean(data?.ok && data?.account_id);

    return {
      ok,
      account_id: data?.account_id,
      email: data?.email ?? null,
      display_name:
        data?.display_name ?? data?.full_name ?? data?.first_name ?? data?.email ?? null,
      phone_e164: data?.phone_e164 ?? null,
      debug: data?.debug,
      raw: data,
    };
  } catch (e: unknown) {
    return { ok: false, raw: normalizeError(e) };
  }
}

function isPublicPath(pathname: string | null) {
  if (!pathname) return false;
  return pathname === "/" || pathname === "/login" || pathname === "/signup";
}

function isProtectedPath(pathname: string | null) {
  return !isPublicPath(pathname);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [token, _setToken] = useState<string | null>(null);
  const [hasSession, _setHasSession] = useState<boolean>(false);
  const [hasSeenWelcome, _setHasSeenWelcome] = useState<boolean>(false);
  const [lastAuthDebug, _setLastAuthDebug] = useState<AuthDebugValue>(null);
  const [authReady, setAuthReady] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);

  const [sessionAccountId, setSessionAccountId] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [sessionDisplayName, setSessionDisplayName] = useState<string | null>(null);
  const [sessionPhone, setSessionPhone] = useState<string | null>(null);

  const redirectingRef = useRef(false);

  const bypassEnabled = process.env.NEXT_PUBLIC_BYPASS_AUTH === "1";

  const setLastAuthDebug = useCallback((v: AuthDebugValue) => {
    _setLastAuthDebug(v);
    try {
      if (v !== null) localStorage.setItem(LS_AUTH_DEBUG_KEY, JSON.stringify(v));
      else localStorage.removeItem(LS_AUTH_DEBUG_KEY);
    } catch {
      // ignore
    }
  }, []);

  const clearAuthDebug = useCallback(() => {
    setLastAuthDebug(null);
  }, [setLastAuthDebug]);

  const setHasSeenWelcome = useCallback((v: boolean) => {
    _setHasSeenWelcome(v);
    try {
      if (v) localStorage.setItem(LS_WELCOME_SEEN_KEY, "1");
      else localStorage.removeItem(LS_WELCOME_SEEN_KEY);
    } catch {
      // ignore
    }
  }, []);

  const markWelcomeSeen = useCallback(() => {
    setHasSeenWelcome(true);
  }, [setHasSeenWelcome]);

  const setToken = useCallback((t: string | null) => {
    _setToken(t);
    try {
      if (t) localStorage.setItem(LS_TOKEN_KEY, t);
      else localStorage.removeItem(LS_TOKEN_KEY);
    } catch {
      // ignore
    }
  }, []);

  const setHasSession = useCallback((v: boolean) => {
    _setHasSession(v);
    try {
      if (v) localStorage.setItem(LS_SESSION_KEY, "1");
      else localStorage.removeItem(LS_SESSION_KEY);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      try {
        const t = localStorage.getItem(LS_TOKEN_KEY);
        const s = localStorage.getItem(LS_SESSION_KEY);
        const d = localStorage.getItem(LS_AUTH_DEBUG_KEY);
        const w = localStorage.getItem(LS_WELCOME_SEEN_KEY);

        if (!mounted) return;

        _setToken(t || null);
        _setHasSession(s === "1");
        _setHasSeenWelcome(w === "1");
        _setLastAuthDebug(safeJsonParse(d));
      } catch {
        // ignore
      }

      const res = await probeCookieSession();

      if (!mounted) return;

      if (res.ok) {
        try {
          localStorage.setItem(LS_SESSION_KEY, "1");
        } catch {
          // ignore
        }

        _setHasSession(true);
        setSessionAccountId(res.account_id ?? null);
        setSessionEmail(res.email ?? null);
        setSessionDisplayName(res.display_name ?? null);
        setSessionPhone(res.phone_e164 ?? null);
        setAccountId(res.account_id ?? null);

        setLastAuthDebug({
          at: new Date().toISOString(),
          op: "probeCookieSession",
          ok: true,
          account_id: res.account_id,
          email: res.email ?? null,
          display_name: res.display_name ?? null,
          phone_e164: res.phone_e164 ?? null,
          debug: res.debug ?? null,
        });
      } else {
        try {
          localStorage.removeItem(LS_SESSION_KEY);
        } catch {
          // ignore
        }

        _setHasSession(false);
        setSessionAccountId(null);
        setSessionEmail(null);
        setSessionDisplayName(null);
        setSessionPhone(null);
        setAccountId(null);

        setLastAuthDebug({
          at: new Date().toISOString(),
          op: "probeCookieSession",
          ok: false,
          root_cause: res.raw,
        });
      }

      setAuthReady(true);
    };

    void boot();

    return () => {
      mounted = false;
    };
  }, [setLastAuthDebug]);

  useEffect(() => {
    if (!authReady || !pathname || redirectingRef.current) return;

    const publicPath = isPublicPath(pathname);
    const protectedPath = isProtectedPath(pathname);

    if (publicPath || bypassEnabled) return;

    if (protectedPath && !hasSession && !token) {
      redirectingRef.current = true;
      const next = pathname !== "/login" ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
      window.setTimeout(() => {
        redirectingRef.current = false;
      }, 500);
    }
  }, [authReady, pathname, hasSession, token, router, bypassEnabled]);

  const refreshSession = useCallback(async () => {
    const res = await probeCookieSession();

    setHasSession(res.ok);
    setSessionAccountId(res.account_id ?? null);
    setSessionEmail(res.email ?? null);
    setSessionDisplayName(res.display_name ?? null);
    setSessionPhone(res.phone_e164 ?? null);
    setAccountId(res.account_id ?? null);

    if (res.ok) {
      clearStoredAuthToken();
      _setToken(null);
      try {
        localStorage.removeItem(LS_TOKEN_KEY);
      } catch {
        // ignore
      }
    }

    setLastAuthDebug({
      at: new Date().toISOString(),
      op: "refreshSession",
      ok: res.ok,
      account_id: res.account_id,
      email: res.email ?? null,
      display_name: res.display_name ?? null,
      phone_e164: res.phone_e164 ?? null,
      debug: res.debug ?? null,
      root_cause: res.ok ? null : res.raw,
    });

    return res.ok;
  }, [setHasSession, setLastAuthDebug]);

  const requireAuth = useCallback(() => {
    const ok = bypassEnabled || Boolean(hasSession) || Boolean(token);

    if (!ok) {
      const next = pathname && pathname !== "/login" ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
      return false;
    }

    return true;
  }, [bypassEnabled, hasSession, token, pathname, router]);

  const logout = useCallback(async () => {
    try {
      await apiJson("web/auth/logout", {
        method: "POST",
        timeoutMs: 12000,
        useAuthToken: false,
      });
    } catch (e: unknown) {
      setLastAuthDebug({
        at: new Date().toISOString(),
        op: "logout",
        ok: false,
        root_cause: normalizeError(e),
      });
    }

    setToken(null);
    clearStoredAuthToken();
    setHasSession(false);
    setHasSeenWelcome(false);
    setSessionAccountId(null);
    setSessionEmail(null);
    setSessionDisplayName(null);
    setSessionPhone(null);
    setAccountId(null);

    try {
      localStorage.removeItem(LS_TOKEN_KEY);
      localStorage.removeItem(LS_SESSION_KEY);
      localStorage.removeItem(LS_WELCOME_SEEN_KEY);
    } catch {
      // ignore
    }

    router.replace("/login");
  }, [router, setHasSession, setHasSeenWelcome, setLastAuthDebug, setToken]);

  const derivedUser: AuthUserLike | null =
    hasSession || Boolean(token) || bypassEnabled
      ? {
          account_id: sessionAccountId,
          email: sessionEmail,
          display_name: sessionDisplayName,
          phone_e164: sessionPhone,
        }
      : null;

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      setToken,
      hasSession,
      setHasSession,
      authReady,
      logout,
      requireAuth,
      refreshSession,
      hasSeenWelcome,
      setHasSeenWelcome,
      markWelcomeSeen,
      lastAuthDebug,
      clearAuthDebug,
      loading: !authReady,
      bypassEnabled,
      user: derivedUser,
      me: derivedUser,
      accountId,
    }),
    [
      token,
      setToken,
      hasSession,
      setHasSession,
      authReady,
      logout,
      requireAuth,
      refreshSession,
      hasSeenWelcome,
      setHasSeenWelcome,
      markWelcomeSeen,
      lastAuthDebug,
      clearAuthDebug,
      bypassEnabled,
      derivedUser,
      accountId,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider />");
  return ctx;
}
