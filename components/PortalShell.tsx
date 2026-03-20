"use client";

import React from "react";
import Sidebar from "@/components/Sidebar";

export default function PortalShell({
  title,
  subtitle,
  rightActions,
  children,
}: {
  title: string;
  subtitle?: string;
  rightActions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", color: "white" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 22 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 18,
          }}
        >
          <div>
            <div style={{ fontSize: 42, fontWeight: 900, lineHeight: 1.1 }}>{title}</div>
            {subtitle ? (
              <div style={{ fontSize: 16, opacity: 0.8, marginTop: 6 }}>{subtitle}</div>
            ) : null}
          </div>
          <div>{rightActions}</div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 18,
            padding: 18,
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
