"use client";

import React from "react";
import { useRouter } from "next/navigation";

type ActionTone = "primary" | "secondary" | "danger";

type ActionItem = {
  label: string;
  onClick?: () => void;
  href?: string;
  tone?: ActionTone;
  disabled?: boolean;
};

type WorkspaceActionBarProps = {
  items?: ActionItem[];
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  dangerLabel?: string;
  onDanger?: () => void;
};

function buttonStyle(tone: ActionTone = "secondary", disabled = false): React.CSSProperties {
  let border = "1px solid var(--border-strong)";
  let background = "var(--button-bg)";

  if (tone === "primary") {
    border = "1px solid var(--accent-border)";
    background = "var(--button-bg-strong)";
  }

  if (tone === "danger") {
    border = "1px solid var(--danger-border)";
    background = "var(--danger-bg)";
  }

  return {
    padding: "14px 18px",
    borderRadius: 16,
    border,
    background,
    color: "var(--text)",
    fontWeight: 900,
    fontSize: 14,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.65 : 1,
  };
}

export default function WorkspaceActionBar(props: WorkspaceActionBarProps) {
  const router = useRouter();

  const normalizedItems: ActionItem[] = Array.isArray(props.items) && props.items.length
    ? props.items
    : [
        props.primaryLabel
          ? {
              label: props.primaryLabel,
              onClick: props.onPrimary,
              tone: "primary",
            }
          : null,
        props.secondaryLabel
          ? {
              label: props.secondaryLabel,
              onClick: props.onSecondary,
              tone: "secondary",
            }
          : null,
        props.dangerLabel
          ? {
              label: props.dangerLabel,
              onClick: props.onDanger,
              tone: "danger",
            }
          : null,
      ].filter(Boolean) as ActionItem[];

  if (!normalizedItems.length) return null;

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
      {normalizedItems.map((item, index) => (
        <button
          key={`${item.label}-${index}`}
          type="button"
          disabled={Boolean(item.disabled)}
          onClick={() => {
            if (item.disabled) return;
            if (item.onClick) {
              item.onClick();
              return;
            }
            if (item.href) {
              router.push(item.href);
            }
          }}
          style={buttonStyle(item.tone || "secondary", Boolean(item.disabled))}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
