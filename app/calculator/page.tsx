"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/app-shell";
import { SectionStack } from "@/components/page-layout";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { apiJson } from "@/lib/api";

type TaxType = "paye" | "vat" | "cit";

export default function CalculatorPage() {
  // Log when component mounts (helps track client-side rendering)
  useEffect(() => {
    console.log("[Calculator] Component mounted successfully");
  }, []);

  const [activeTab, setActiveTab] = useState<TaxType>("paye");
  const [inputs, setInputs] = useState<any>({
    monthly_gross_income: 0,
    pension_contribution: 0,
    nhf: 0,
    taxable_supplies: 0,
    input_vat: 0,
    gross_profit: 0,
    allowable_expenses: 0,
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setInputs({ ...inputs, [field]: numValue });
    console.log(`[Calculator] Input changed: ${field} = ${numValue}`);
  };

  const calculate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    console.log(`[Calculator] Starting calculation for ${activeTab} with inputs:`, inputs);

    try {
      const payload = { type: activeTab, inputs };
      console.log("[Calculator] Sending request to /api/tax/calculate with payload:", payload);

      const res = await apiJson("/api/tax/calculate", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      console.log("[Calculator] API response received:", res);

      if (res && res.ok) {
        setResult(res);
        console.log("[Calculator] Calculation successful, answer:", res.answer);
      } else {
        const errMsg = res?.error || "Calculation returned no result";
        setError(errMsg);
        console.error("[Calculator] API returned error:", errMsg);
      }
    } catch (err: any) {
      const errMsg = err?.message || "Calculation failed";
      setError(errMsg);
      console.error("[Calculator] Exception during calculation:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderPAYEForm = () => (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 800 }}>Monthly Gross Income (₦)</label>
        <input
          type="number"
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }}
          onChange={(e) => handleInputChange("monthly_gross_income", e.target.value)}
          placeholder="e.g., 500000"
        />
      </div>
      <div>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 800 }}>Pension Contribution (₦)</label>
        <input
          type="number"
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }}
          onChange={(e) => handleInputChange("pension_contribution", e.target.value)}
          placeholder="Optional"
        />
      </div>
      <div>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 800 }}>NHF Contribution (₦)</label>
        <input
          type="number"
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }}
          onChange={(e) => handleInputChange("nhf", e.target.value)}
          placeholder="Optional"
        />
      </div>
    </div>
  );

  const renderVATForm = () => (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 800 }}>Taxable Supplies (₦)</label>
        <input
          type="number"
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }}
          onChange={(e) => handleInputChange("taxable_supplies", e.target.value)}
        />
      </div>
      <div>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 800 }}>Input VAT (₦)</label>
        <input
          type="number"
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }}
          onChange={(e) => handleInputChange("input_vat", e.target.value)}
          placeholder="Optional"
        />
      </div>
    </div>
  );

  const renderCITForm = () => (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 800 }}>Gross Profit (₦)</label>
        <input
          type="number"
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }}
          onChange={(e) => handleInputChange("gross_profit", e.target.value)}
        />
      </div>
      <div>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 800 }}>Allowable Expenses (₦)</label>
        <input
          type="number"
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }}
          onChange={(e) => handleInputChange("allowable_expenses", e.target.value)}
        />
      </div>
    </div>
  );

  return (
    <AppShell title="Tax Calculator" subtitle="Compute PAYE, VAT, and Company Income Tax instantly.">
      <SectionStack>
        <WorkspaceSectionCard title="Select Tax Type">
          <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
            {["paye", "vat", "cit"].map((type) => (
              <button
                key={type}
                onClick={() => {
                  console.log(`[Calculator] Tab switched to ${type}`);
                  setActiveTab(type as TaxType);
                  setResult(null);
                  setError(null);
                }}
                style={{
                  padding: "10px 20px",
                  borderRadius: 999,
                  border: "none",
                  background: activeTab === type ? "var(--accent)" : "var(--surface-soft)",
                  color: activeTab === type ? "white" : "var(--text)",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard title="Enter Details">
          {activeTab === "paye" && renderPAYEForm()}
          {activeTab === "vat" && renderVATForm()}
          {activeTab === "cit" && renderCITForm()}
          <button
            onClick={calculate}
            disabled={loading}
            style={{
              marginTop: 24,
              width: "100%",
              padding: "14px",
              borderRadius: 14,
              border: "none",
              background: "var(--accent)",
              color: "white",
              fontWeight: 900,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Calculating..." : "Calculate Tax"}
          </button>
        </WorkspaceSectionCard>

        {error && (
          <WorkspaceSectionCard title="Error">
            <div style={{ padding: 16, background: "rgba(244,63,94,0.1)", borderRadius: 16, color: "#dc2626" }}>
              <strong>Calculation failed:</strong> {error}
              <div style={{ fontSize: 12, marginTop: 8, color: "var(--text-muted)" }}>
                Check the browser console (F12) for detailed logs.
              </div>
            </div>
          </WorkspaceSectionCard>
        )}

        {result && result.ok && (
          <WorkspaceSectionCard title="Result">
            <div style={{ padding: 16, background: "var(--surface-soft)", borderRadius: 16 }}>
              {result.answer}
            </div>
          </WorkspaceSectionCard>
        )}
      </SectionStack>
    </AppShell>
  );
}
