import type { ReactNode } from "react";
import ChannelActivationControl from "@/components/channel-activation-control";
import ChannelActivationSummary from "@/components/channel-activation-summary";
import ChannelEntitlementGuidance from "@/components/channel-entitlement-guidance";

export default function ChannelsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ChannelActivationControl />
      <ChannelActivationSummary />
      <ChannelEntitlementGuidance />
      {children}
    </>
  );
}
