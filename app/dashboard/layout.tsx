import type { ReactNode } from "react";
import ChannelStateBanner from "@/components/channel-state-banner";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ChannelStateBanner compact />
      {children}
    </>
  );
}
