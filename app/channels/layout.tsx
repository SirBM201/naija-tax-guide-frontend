import type { ReactNode } from "react";
import ChannelActivationControl from "@/components/channel-activation-control";
import ChannelActivationSummary from "@/components/channel-activation-summary";

export default function ChannelsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ChannelActivationControl />
      <ChannelActivationSummary />
      {children}
    </>
  );
}
