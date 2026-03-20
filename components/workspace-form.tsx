"use client";

import React from "react";

export function WorkspaceField({
  label,
  htmlFor,
  helper,
  children,
}: {
  label: string;
  htmlFor?: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <label
        htmlFor={htmlFor}
        style={{
          color: "var(--text)",
          fontWeight: 800,
          fontSize: 14,
          lineHeight: 1.4,
        }}
      >
        {label}
      </label>

      {children}

      {helper ? (
        <div
          style={{
            color: "var(--text-muted)",
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          {helper}
        </div>
      ) : null}
    </div>
  );
}

export function workspaceInputStyle(): React.CSSProperties {
  return {
    width: "100%",
    borderRadius: 14,
    border: "1px solid var(--border-strong)",
    background: "var(--input-bg)",
    color: "var(--text)",
    padding: "14px 16px",
    fontSize: 15,
    outline: "none",
  };
}

export function workspaceTextareaStyle(): React.CSSProperties {
  return {
    width: "100%",
    borderRadius: 16,
    border: "1px solid var(--border-strong)",
    background: "var(--input-bg)",
    color: "var(--text)",
    padding: 16,
    fontSize: 16,
    lineHeight: 1.7,
    outline: "none",
    resize: "vertical",
  };
}

export function workspaceSelectStyle(): React.CSSProperties {
  return {
    minHeight: 46,
    width: "100%",
    borderRadius: 14,
    border: "1px solid var(--border-strong)",
    background: "var(--surface)",
    color: "var(--text)",
    padding: "10px 12px",
    outline: "none",
  };
}