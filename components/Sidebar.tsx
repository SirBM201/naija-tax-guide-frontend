// components/Sidebar.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

function NavItem({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        padding: "16px 16px",
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.10)",
        background: active ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)",
        color: "rgba(255,255,255,0.92)",
        fontWeight: 900,
        letterSpacing: 0.2,
      }}
    >
      {label}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { setToken } = useAuth();

  const items = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/ask", label: "Quick Ask" },
    { href: "/web-chat", label: "Tax Assistant Chat" },
    { href: "/billing", label: "Billing" },
  ];

  return (
    <aside
      style={{
        width: 320,
        padding: 18,
        borderRight: "1px solid rgba(255,255,255,0.10)",
        background:
          "radial-gradient(600px 500px at 50% 0%, rgba(120, 140, 255, 0.16), transparent 60%), rgba(255,255,255,0.02)",
      }}
    >
      {/* BRAND */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 18 }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.06)",
            display: "grid",
            placeItems: "center",
            fontWeight: 950,
            color: "rgba(255,255,255,0.92)",
          }}
        >
          NT
        </div>
        <div>
          <div style={{ fontWeight: 950, fontSize: 16 }}>NaijaTax Guide</div>
          <div style={{ color: "rgba(255,255,255,0.60)", fontSize: 12, marginTop: 2 }}>Web Portal</div>
        </div>
      </div>

      {/* NAV */}
      <div style={{ display: "grid", gap: 12 }}>
        {items.map((it) => (
          <NavItem key={it.href} href={it.href} label={it.label} active={pathname === it.href} />
        ))}
      </div>

      {/* LOGOUT */}
      <div style={{ marginTop: 18 }}>
        <button
          onClick={() => setToken(null)}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: 18,
            border: "1px solid rgba(255,120,120,0.35)",
            background: "rgba(255,80,80,0.12)",
            color: "rgba(255,255,255,0.95)",
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          Logout
        </button>

        <div style={{ marginTop: 10, color: "rgba(255,255,255,0.55)", fontSize: 12, lineHeight: 1.4 }}>
          Clears your saved session token from this browser.
        </div>
      </div>
    </aside>
  );
}