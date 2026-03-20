"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function AuthNav() {
  const { loading, token, logout } = useAuth();

  if (loading) {
    return <span style={{ color: "#aaa", fontSize: 13 }}>Checking session…</span>;
  }

  if (!token) {
    return (
      <Link href="/login" style={{ color: "#fff", textDecoration: "none", fontWeight: 700 }}>
        Login
      </Link>
    );
  }

  return (
    <button
      onClick={logout}
      style={{
        padding: "8px 12px",
        borderRadius: 10,
        border: "1px solid #2a2a2a",
        background: "rgba(255,255,255,0.03)",
        color: "#fff",
        cursor: "pointer",
        fontWeight: 700
      }}
    >
      Logout
    </button>
  );
}
