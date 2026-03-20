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
    <Card title={title} subtitle={subtitle}>
      <div style={{ display: "grid", gap: 16 }}>{children}</div>
    </Card>
  );
}