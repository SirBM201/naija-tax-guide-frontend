"use client";

import { useCallback, useEffect, useState } from "react";
import { apiJson } from "@/lib/api";

type Channel = "whatsapp" | "telegram";
type Snapshot = {
  ok?: boolean;
  plan_code?: string;
  connected_channels?: Channel[];
  active_channels?: Channel[];
  paused_channels?: Channel[];
  connected_count?: number;
  active_count?: number;
  selection_required?: boolean;
  max_active_channels?: number;
};

const names: Record<Channel, string> = { whatsapp: "WhatsApp", telegram: "Telegram" };

export default function ChannelActivationSummary() {
  const [state, setState] = useState<Snapshot | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiJson<Snapshot>("/channels/activation", {
        method: "GET",
        timeoutMs: 20000,
        useAuthToken: false,
      });
      setState(res);
    } catch {
      setState(null);
    }
  }, []);

  useEffect(() => {
    void load();
    const refresh = () => void load();
    window.addEventListener("ntg:channel-activation-changed", refresh);
    return () => window.removeEventListener("ntg:channel-activation-changed", refresh);
  }, [load]);

  if (!state?.ok) return null;

  const connected = state.connected_channels || [];
  const active = state.active_channels || [];
  const paused = state.paused_channels || [];
  const activeCount = state.active_count ?? active.length;
  const connectedCount = state.connected_count ?? connected.length;
  const max = state.max_active_channels ?? 0;

  return (
    <section style={{display:"grid",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12}}>
        <div style={card}><div style={label}>ACTIVE CHANNELS</div><div style={value}>{activeCount} / {max}</div><div style={sub}>Channels currently entitled to use NTG services.</div></div>
        <div style={card}><div style={label}>CONNECTED</div><div style={value}>{connectedCount}</div><div style={sub}>Durable connections preserved on your account.</div></div>
        <div style={card}><div style={label}>PAUSED</div><div style={value}>{paused.length}</div><div style={sub}>Preserved connections that cannot currently consume services.</div></div>
      </div>
      {connected.length ? (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
          {connected.map(channel => {
            const isActive = active.includes(channel);
            const isPaused = paused.includes(channel);
            return <div key={channel} style={{...card,border:isActive?"1px solid #a7f3d0":isPaused?"1px solid #fed7aa":"1px solid #e2e8f0"}}>
              <div style={{fontWeight:900,color:"#0f172a"}}>{names[channel]}</div>
              <div style={{fontWeight:800,color:isActive?"#047857":isPaused?"#9a3412":"#64748b"}}>{isActive?"Active":isPaused?"Connected · Paused":"Connected · awaiting selection"}</div>
            </div>;
          })}
        </div>
      ) : null}
      <div style={{padding:14,borderRadius:16,background:"#f8fafc",border:"1px solid #e2e8f0",color:"#475569",lineHeight:1.6,fontSize:14}}>
        Active capacity and durable connections are different. Reaching the active limit does not require you to unlink an existing connection. On downgrade, excess connections stay saved and are paused; use the selector above to choose which permitted channel remains active.
      </div>
    </section>
  );
}

const card = {border:"1px solid #e2e8f0",borderRadius:18,background:"#fff",padding:16,display:"grid",gap:7} as const;
const label = {fontSize:12,fontWeight:900,color:"#64748b",letterSpacing:.5} as const;
const value = {fontSize:24,fontWeight:900,color:"#0f172a"} as const;
const sub = {fontSize:13,color:"#64748b",lineHeight:1.5} as const;
