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
  error?: string;
};

const label: Record<Channel, string> = { whatsapp: "WhatsApp", telegram: "Telegram" };

export default function ChannelActivationControl() {
  const [state, setState] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

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

  useEffect(() => { void load(); }, [load]);

  async function choose(channel: Channel) {
    setBusy(true);
    setMessage("");
    try {
      const res = await apiJson<Snapshot>("/channels/activation", {
        method: "POST",
        timeoutMs: 20000,
        useAuthToken: false,
        body: { channels: [channel] },
      });
      if (!res?.ok) throw new Error(res?.error || "Could not update active channel.");
      setMessage(`${label[channel]} is now your active messaging channel. Your other connection is preserved and paused.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update active channel.");
    } finally {
      setBusy(false);
    }
  }

  if (!state?.ok || (state.connected_count || 0) < 1) return null;

  const connected = state.connected_channels || [];
  const active = state.active_channels || [];
  const paused = state.paused_channels || [];
  const max = state.max_active_channels || 0;
  const needsChoice = Boolean(state.selection_required);

  return (
    <section style={{margin:"0 0 18px",padding:18,borderRadius:20,border:needsChoice?"1px solid #fdba74":"1px solid #dbeafe",background:needsChoice?"#fff7ed":"#f8fbff"}}>
      <div style={{fontWeight:900,fontSize:18,color:"#0f172a"}}>
        {needsChoice ? "Choose your active messaging channel" : "Messaging channel access"}
      </div>
      <p style={{margin:"8px 0 14px",lineHeight:1.6,color:"#475569"}}>
        Your {state.plan_code || "current"} plan allows {max} active external messaging channel{max === 1 ? "" : "s"}. Connected channels are never deleted automatically when you downgrade.
      </p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12}}>
        {connected.map((channel) => {
          const isActive = active.includes(channel);
          const isPaused = paused.includes(channel);
          return (
            <div key={channel} style={{padding:14,borderRadius:16,border:"1px solid #e2e8f0",background:"#fff"}}>
              <div style={{fontWeight:800,color:"#0f172a"}}>{label[channel]}</div>
              <div style={{margin:"5px 0 12px",fontSize:13,color:isActive?"#047857":isPaused?"#9a3412":"#64748b"}}>
                {isActive ? "Active" : isPaused ? "Paused — connection preserved" : "Connected"}
              </div>
              {max === 1 && !isActive ? (
                <button type="button" disabled={busy} onClick={() => void choose(channel)} style={{border:0,borderRadius:12,padding:"10px 13px",fontWeight:800,cursor:busy?"wait":"pointer",background:"#4f46e5",color:"#fff"}}>
                  {busy ? "Updating…" : `Keep ${label[channel]} active`}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
      {message ? <div style={{marginTop:12,fontSize:14,fontWeight:700,color:"#334155"}}>{message}</div> : null}
    </section>
  );
}
