"use client";

import React from "react";

type TopAction = {
  label: string;
  onClick: () => void;
  tone?: "default" | "good" | "danger";
  disabled?: boolean;
};

type AppTopbarProps = {
  title: string;
  subtitle: string;
  actions?: TopAction[];
};

export default function AppTopbar({
  title,
  subtitle,
  actions = [],
}: AppTopbarProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        alignItems: "flex-start",
        flexWrap: "wrap",
      }}
    >
      <div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 950,
            color: "white",
            letterSpacing: -1,
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: 10,
            color: "rgba(255,255,255,0.72)",
            fontSize: 20,
            maxWidth: 820,
            lineHeight: 1.6,
          }}
        >
          {subtitle}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {actions.map((action) => {
          const tone = action.tone || "default";
          const style =
            tone === "good"
              ? buttonStylePrimary
              : tone === "danger"
              ? buttonStyleDanger
              : buttonStyleSecondary;

          return (
            <button
              key={action.label}
              onClick={action.onClick}
              disabled={action.disabled}
              style={{
                ...style,
                cursor: action.disabled ? "not-allowed" : "pointer",
                opacity: action.disabled ? 0.7 : 1,
              }}
            >
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const buttonStylePrimary: React.CSSProperties = {
  padding: "14px 18px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  fontWeight: 900,
};

export const buttonStyleSecondary: React.CSSProperties = {
  padding: "14px 18px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  fontWeight: 900,
};

export const buttonStyleDanger: React.CSSProperties = {
  padding: "14px 18px",
  borderRadius: 16,
  border: "1px solid rgba(255,120,120,0.22)",
  background: "rgba(255,80,80,0.08)",
  color: "white",
  fontWeight: 900,
};