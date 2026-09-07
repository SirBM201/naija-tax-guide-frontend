"use client";

import React, { useCallback, useEffect, useState } from "react";
import { apiJson, isApiError } from "@/lib/api";
import { Banner } from "@/components/ui";

type Channel = "whatsapp" | "telegram";
type ActivationSnapshot = {
  ok?: boolean;
  connected_channels?: Channel[];
  active_channels?: Channel[];
  paused_channels?: Channel[];
  connected_count?: number;
  active_count?: number;
  selection_required?: boolean;
  max_active_channels?: number;
};

export default function ChannelEntitlementGuidance() {
  const [state, setState] = useState<ActivationSnapshot | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      setState(await apiJson<ActivationSnapshot>("/channels/activation", {
        method: "GET",
        timeoutMs: 20000,
        useAuthToken: false,
      }));
    } catch (err: unknown) {
      setError(isApiError(err) ? err.message || "Unable to load channel activation state." : "Unable to load channel activation state.");
    }
  }, []);

  useEffect(() => {
    void load();
    const refresh = () => void load();
    window.addEventListener("ntg:channel-activation-changed", refresh);
    return () => window.removeEventListener("ntg:channel-activation-changed", refresh);
  }, [load]);

  if (error) {
    return <Banner tone="warn" title="Channel activation check needs attention" subtitle={error} />;
  }
  if (!state) return null;

  const connected = state.connected_count ?? state.connected_channels?.length ?? 0;
  const active = state.active_count ?? state.active_channels?.length ?? 0;
  const paused = state.paused_channels?.length ?? 0;
  const allowed = state.max_active_channels ?? 0;

  if (state.selection_required) {
    return (
      <Banner
        tone="warn"
        title="Choose which connected channel stays active"
        subtitle={`Your ${connected} saved connection${connected === 1 ? "" : "s"} remain preserved. Your current plan allows ${allowed} active external channel${allowed === 1 ? "" : "s"}; excess connections are paused, not deleted. Use the channel selector above to choose the active connection. You do not need to unlink a channel just because your plan changed.`}
      />
    );
  }

  return (
    <Banner
      tone="good"
      title="Connected and active channels are tracked separately"
      subtitle={`${active} / ${allowed} active · ${connected} connected${paused ? ` · ${paused} paused` : ""}. A paused connection remains saved and can be reactivated when your entitlement permits it.`}
    />
  );
}
