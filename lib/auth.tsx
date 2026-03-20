"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiJson, isApiError, clearStoredAuthToken } from "@/lib/api";

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

  lastAuthDebug: any;
  clearAuthDebug: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const LS_TOKEN_KEY = "nt_access_token";
const LS_SESSION_KEY = "nt_has_session";
const LS_AUTH_DEBUG_KEY = "nt_auth_debug";
const LS_WELCOME_SEEN_KEY = "ntg-welcome-seen";

type WebMeResp = {
  ok?: boolean;
  account_id?: string;
  error?: string;
  debug?: any;
};

function safeJsonParse(s: string | null): any {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

function normalizeError(e: any) {
  if (isApiError(e)) {
    return {
      kind: "ApiError",
      status: e.status,
      message: e.message,
      data: e.data,
    };
  }
  return {
    kind: "UnknownError",
    message: String(e?.message || e),
  };
}

async function probeCookieSession(): Promise<{ ok: boolean; account_id?: string; debug?: any; raw?: any }> {
  try {
    const data = await apiJson<WebMeResp>("/web/auth/me", {
      method: "GET",
      timeoutMs: 12000,
      useAuthToken: false,
    });
    const ok = Boolean(data?.ok && data?.account_id);
    return { ok, account_id: data?.account_id, debug: data?.debug, raw: data };
  } catch (e: any) {
    return { ok: false, raw: normalizeError(e) };
  }
}

function isPublicPath(pathname: string | null) {
  if (!pathname) return false;
  return pathname === "/" || pathname === "/login";
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
  const [lastAuthDebug, _setLastAuthDebug] = useState<any>(null);
  const [authReady, setAuthReady] = useState(false);

  const redirectingRef = useRef(false);

  const setLastAuthDebug = (v: any) => {
    _setLastAuthDebug(v);
    try {
      if (v) localStorage.setItem(LS_AUTH_DEBUG_KEY, JSON.stringify(v));
      else localStorage.removeItem(LS_AUTH_DEBUG_KEY);
    } catch {
      // ignore
    }
  };

  const clearAuthDebug = () => setLastAuthDebug(null);

  const setHasSeenWelcome = (v: boolean) => {
    _setHasSeenWelcome(v);
    try {
      if (v) localStorage.setItem(LS_WELCOME_SEEN_KEY, "1");
      else localStorage.removeItem(LS_WELCOME_SEEN_KEY);
    } catch {
      // ignore
    }
  };

  const markWelcomeSeen = () => setHasSeenWelcome(true);

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
        } catch {}

        _setHasSession(true);

        setLastAuthDebug({
          at: new Date().toISOString(),
          op: "probeCookieSession",
          ok: true,
          account_id: res.account_id,
          debug: res.debug || null,
        });
      } else {
        try {
          localStorage.removeItem(LS_SESSION_KEY);
        } catch {}

        _setHasSession(false);

        setLastAuthDebug({
          at: new Date().toISOString(),
          op: "probeCookieSession",
          ok: false,
          root_cause: res.raw,
        });
      }

      setAuthReady(true);
    };

    boot();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!pathname) return;
    if (redirectingRef.current) return;

    const publicPath = isPublicPath(pathname);
    const protectedPath = isProtectedPath(pathname);

    if (publicPath) {
      return;
    }

    if (protectedPath && !hasSession && !token) {
      redirectingRef.current = true;
      const next = pathname !== "/login" ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
      setTimeout(() => {
        redirectingRef.current = false;
      }, 500);
    }
  }, [authReady, pathname, hasSession, token, router]);

  const setToken = (t: string | null) => {
    _setToken(t);
    try {
      if (t) localStorage.setItem(LS_TOKEN_KEY, t);
      else localStorage.removeItem(LS_TOKEN_KEY);
    } catch {
      // ignore
    }
  };

  const setHasSession = (v: boolean) => {
    _setHasSession(v);
    try {
      if (v) localStorage.setItem(LS_SESSION_KEY, "1");
      else localStorage.removeItem(LS_SESSION_KEY);
    } catch {
      // ignore
    }
  };

  const refreshSession = async () => {
    const res = await probeCookieSession();

    setHasSession(res.ok);

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
      debug: res.debug || null,
      root_cause: res.ok ? null : res.raw,
    });

    return res.ok;
  };

  const requireAuth = () => {
    const ok = Boolean(hasSession) || Boolean(token);

    if (!ok) {
      const next = pathname && pathname !== "/login" ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
      return false;
    }
    return true;
  };

  const logout = async () => {
    try {
      await apiJson("/web/auth/logout", {
        method: "POST",
        timeoutMs: 12000,
        useAuthToken: false,
      });
    } catch (e: any) {
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

    try {
      localStorage.removeItem(LS_TOKEN_KEY);
      localStorage.removeItem(LS_SESSION_KEY);
      localStorage.removeItem(LS_WELCOME_SEEN_KEY);
    } catch {
      // ignore
    }

    router.replace("/login");
  };

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
    }),
    [token, hasSession, authReady, hasSeenWelcome, lastAuthDebug]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider />");
  return ctx;
}