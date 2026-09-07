import type { ReactNode } from "react";
import ChannelActivationControl from "@/components/channel-activation-control";

export default function ChannelsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ChannelActivationControl />
      {children}
    </>
  );
}
