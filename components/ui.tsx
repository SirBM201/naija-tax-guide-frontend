"use client";

import React from "react";

type Tone = "default" | "good" | "warn" | "danger";

type BannerProps = {
  tone?: Tone;
  title: string;
  subtitle?: string;
};

type MetricCardProps = {
  label: string;
  value: string;
  helper?: string;
  tone?: Tone;
};

type ShortcutCardProps = {
  title: string;
  subtitle: string;
  tone?: Tone;
  onClick?: () => void;
};

type CardProps = {
  children: React.ReactNode;
  tone?: Tone;
  style?: React.CSSProperties;
};

function toneBorder(tone: Tone): string {
  if (tone === "good") return "var(--success-border)";
  if (tone === "warn") return "var(--warn-border)";
  if (tone === "danger") return "var(--danger-border)";
  return "var(--border)";
}

function toneBackground(tone: Tone): string {
  if (tone === "good") return "var(--success-bg)";
  if (tone === "warn") return "var(--warn-bg)";
  if (tone === "danger") return "var(--danger-bg)";
  return "var(--surface)";
}

export function toneSurface(tone: Tone = "default"): React.CSSProperties {
  return {
    borderRadius: 18,
    border: `1px solid ${toneBorder(tone)}`,
    background: toneBackground(tone),
    padding: 16,
  };
}

export function Card({ children, tone = "default", style }: CardProps) {
  return <div style={{ ...toneSurface(tone), ...style }}>{children}</div>;
}

export function Banner({ tone = "default", title, subtitle }: BannerProps) {
  return (
    <div style={toneSurface(tone)}>
      <div style={{ fontWeight: 900, fontSize: 16, color: "var(--text)" }}>{title}</div>
      {subtitle ? (
        <div style={{ marginTop: 6, color: "var(--text-muted)", lineHeight: 1.7, fontSize: 14 }}>
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

export function MetricCard({ label, value, helper, tone = "default" }: MetricCardProps) {
  return (
    <div style={toneSurface(tone)}>
      <div style={{ color: "var(--text-faint)", fontSize: 13 }}>{label}</div>
      <div style={{ marginTop: 8, color: "var(--text)", fontWeight: 900, fontSize: 24, lineHeight: 1.15 }}>
        {value}
      </div>
      {helper ? (
        <div style={{ marginTop: 8, color: "var(--text-muted)", fontSize: 13, lineHeight: 1.65 }}>
          {helper}
        </div>
      ) : null}
    </div>
  );
}

export function ShortcutCard({ title, subtitle, tone = "default", onClick }: ShortcutCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...toneSurface(tone),
        width: "100%",
        textAlign: "left",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div style={{ fontWeight: 900, fontSize: 17, color: "var(--text)" }}>{title}</div>
      <div style={{ marginTop: 8, color: "var(--text-muted)", lineHeight: 1.7, fontSize: 14 }}>
        {subtitle}
      </div>
    </button>
  );
}

export function appInputStyle(kind: "default" | "button" | "buttonSecondary" = "default"): React.CSSProperties {
  if (kind === "button") {
    return {
      padding: "14px 18px",
      borderRadius: 16,
      border: "1px solid var(--accent-border)",
      background: "var(--button-bg-strong)",
      color: "var(--text)",
      fontWeight: 900,
      fontSize: 14,
    };
  }

  if (kind === "buttonSecondary") {
    return {
      padding: "14px 18px",
      borderRadius: 16,
      border: "1px solid var(--border-strong)",
      background: "var(--button-bg)",
      color: "var(--text)",
      fontWeight: 900,
      fontSize: 14,
    };
  }

  return {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 16,
    border: "1px solid var(--border-strong)",
    background: "var(--surface)",
    color: "var(--text)",
    fontSize: 14,
    outline: "none",
  };
}

export function appTextareaStyle(): React.CSSProperties {
  return {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 16,
    border: "1px solid var(--border-strong)",
    background: "var(--surface)",
    color: "var(--text)",
    fontSize: 14,
    outline: "none",
    resize: "vertical",
    minHeight: 140,
    lineHeight: 1.7,
  };
}

export function appSelectStyle(): React.CSSProperties {
  return {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 16,
    border: "1px solid var(--border-strong)",
    background: "var(--surface)",
    color: "var(--text)",
    fontSize: 14,
    outline: "none",
  };
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "—";
  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatCurrency(amount: number, currency: string = "NGN"): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(safeAmount);
  } catch {
    return `${currency} ${safeAmount.toLocaleString()}`;
  }
}

export function planDisplayName(input: unknown, fallback = "No active plan"): string {
  if (typeof input === "string") {
    const clean = input.trim();
    if (!clean) return fallback;
    return clean
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  if (input && typeof input === "object") {
    const obj = input as Record<string, unknown>;
    const preferred =
      obj.plan_name ||
      obj.name ||
      obj.planCode ||
      obj.plan_code ||
      obj.code ||
      obj.label;
    return planDisplayName(preferred, fallback);
  }

  return fallback;
}
