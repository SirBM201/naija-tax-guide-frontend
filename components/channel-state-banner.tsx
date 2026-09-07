"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiJson } from "@/lib/api";

type ChannelIdentity = {
  channel_type?: string;
  provider_user_id?: string;
  is_active?: boolean;
  status?: string;
};

type ActivationSnapshot = {
  ok?: boolean;
  connected?: ChannelIdentity[];
  active?: ChannelIdentity[];
  paused?: ChannelIdentity[];
  connected_count?: number;
  active_count?: number;
  paused_count?: number;
  max_active_channels?: number;
  selection_required?: boolean;
};

export default function ChannelStateBanner({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<ActivationSnapshot | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const result = await apiJson<ActivationSnapshot>("/channels/activation", {
        method: "GET",
        timeoutMs: 20000,
        useAuthToken: false,
      });
      setSnapshot(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load channel activation state.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (error) return null;
  if (!snapshot?.ok) return null;

  const active = Number(snapshot.active_count || 0);
  const connected = Number(snapshot.connected_count || 0);
  const paused = Number(snapshot.paused_count || 0);
  const allowed = Number(snapshot.max_active_channels || 0);
  const choose = Boolean(snapshot.selection_required);

  return (
    <section style={{
      border: choose ? "1px solid #fdba74" : "1px solid #c7d2fe",
      background: choose ? "#fff7ed" : "#eef2ff",
      borderRadius: 18,
      padding: compact ? 14 : 18,
      display: "grid",
      gap: 10,
      marginBottom: 16,
    }}>
      <div style={{ fontWeight: 900, fontSize: compact ? 15 : 17, color: choose ? "#9a3412" : "#312e81" }}>
        {choose ? "Choose your active channel" : "Channel access"}
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.6, color: "#475569" }}>
        <strong>{active} / {allowed} active</strong> · {connected} connected · {paused} paused
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.6, color: "#64748b" }}>
        Connected channels are preserved. Your plan limit controls how many can be active at the same time; excess channels are paused rather than deleted.
      </div>
      {choose ? (
        <button type="button" onClick={() => router.push("/channels")} style={{
          width: "fit-content", border: 0, borderRadius: 12, padding: "10px 14px",
          background: "#ea580c", color: "#fff", fontWeight: 800, cursor: "pointer",
        }}>
          Choose active channel
        </button>
      ) : null}
    </section>
  );
}
