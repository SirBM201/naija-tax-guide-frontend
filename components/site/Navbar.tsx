"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string };

const NAV: NavItem[] = [
  { href: "/pricing", label: "Pricing" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/link", label: "Link" },
  { href: "/chat", label: "Chat" },
  { href: "/support", label: "Support" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/refund", label: "Refund" },
  { href: "/data-deletion", label: "Data Deletion" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
      {NAV.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              color: active ? "#fff" : "#ddd",
              textDecoration: "none",
              fontWeight: active ? 900 : 600,
              padding: "6px 8px",
              borderRadius: 10,
              border: active ? "1px solid #333" : "1px solid transparent",
              background: active ? "rgba(255,255,255,0.06)" : "transparent",
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
