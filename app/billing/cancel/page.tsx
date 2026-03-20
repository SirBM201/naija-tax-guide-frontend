"use client";

import React from "react";
import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "rgba(7,10,18,1)", color: "white" }}>
      <div style={{ width: "100%", maxWidth: 760, borderRadius: 22, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)", padding: 22 }}>
        <div style={{ fontSize: 42, fontWeight: 950, letterSpacing: -1 }}>Payment Cancelled</div>
        <div style={{ marginTop: 10, color: "rgba(255,255,255,0.75)" }}>
          You cancelled the Paystack checkout. You can try again anytime.
        </div>

        <div style={{ marginTop: 18 }}>
          <Link href="/plans" style={{ color: "white", fontWeight: 900, textDecoration: "underline" }}>
            Back to Plans
          </Link>
        </div>
      </div>
    </div>
  );
}