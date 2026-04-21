"use client";

import React, { useState } from "react";
import AppShell from "@/components/app-shell";
import { SectionStack } from "@/components/page-layout";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { apiJson } from "@/lib/api";

type TaxType = "paye" | "vat" | "cit";

export default function CalculatorPage() {
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

  const handleInputChange = (field: string, value: string) => {
    setInputs({ ...inputs, [field]: parseFloat(value) || 0 });
  };

  const calculate = async () => {
    setLoading(true);
    try {
      const res = await apiJson("/api/tax/calculate", {
        method: "POST",
        body: JSON.stringify({ type: activeTab, inputs }),
      });
      setResult(res);
    } catch (err) {
      console.error(err);
      setResult({ ok: false, error: "Calculation failed" });
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
        />
      </div>
      <div>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 800 }}>Pension Contribution (₦)</label>
        <input
          type="number"
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }}
          onChange={(e) => handleInputChange("pension_contribution", e.target.value)}
        />
      </div>
      <div>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 800 }}>NHF Contribution (₦)</label>
        <input
          type="number"
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }}
          onChange={(e) => handleInputChange("nhf", e.target.value)}
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
                onClick={() => setActiveTab(type as TaxType)}
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

        {result && (
          <WorkspaceSectionCard title="Result">
            {result.ok ? (
              <div style={{ padding: 16, background: "var(--surface-soft)", borderRadius: 16 }}>
                {result.answer}
              </div>
            ) : (
              <div style={{ color: "var(--danger)" }}>{result.error}</div>
            )}
          </WorkspaceSectionCard>
        )}
      </SectionStack>
    </AppShell>
  );
}
