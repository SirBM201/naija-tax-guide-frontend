"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function AuthNav() {
  const { token, me, loading, logout } = useAuth();

  if (loading) {
    return <span style={{ color: "#aaa" }}>...</span>;
  }

  if (!token) {
    return (
      <Link
        href="/login"
        style={{ color: "#fff", textDecoration: "none", fontWeight: 800 }}
      >
        Login
      </Link>
    );
  }

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <span style={{ color: "#bbb", fontSize: 13 }}>
        {me?.email || "Account"}
      </span>
      <button
        onClick={() => {
          void logout();
        }}
        style={{
          padding: "8px 10px",
          borderRadius: 10,
          border: "1px solid #2a2a2a",
          background: "rgba(255,255,255,0.03)",
          color: "#fff",
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        Logout
      </button>
    </div>
  );
}