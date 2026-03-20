// components/RequireAuth.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { requireAuth, refreshSession } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 1) Fast gate: requireAuth() redirects if not authed locally
    const ok = requireAuth();
    if (!ok) return;

    // 2) Best-effort: confirm cookie session (prevents stale session marker)
    refreshSession()
      .catch(() => {})
      .finally(() => setReady(true));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}