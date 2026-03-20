"use client";

import React from "react";
import Providers from "@/components/Providers";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}