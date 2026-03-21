"use client";

import React from "react";
import { Card } from "@/components/ui";

export default function WorkspaceSectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "white" }}>{title}</div>
          {subtitle ? (
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.5,
                color: "rgba(255,255,255,0.72)",
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>

        <div style={{ display: "grid", gap: 16 }}>{children}</div>
      </div>
    </Card>
  );
}