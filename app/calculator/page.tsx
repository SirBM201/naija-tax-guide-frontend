"use client";

import React, { useState, useEffect, useRef } from "react";
import AppShell from "@/components/app-shell";
import { SectionStack } from "@/components/page-layout";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { useAuth } from "@/lib/auth";
import { generateTaxPDF } from "@/lib/pdf-generator";

type TaxType = "paye" | "vat" | "cit";

const initialInputs = {
  monthly_gross_income: 0,
  pension_contribution: 0,
  pension_percent: 0,
  nhf: 0,
  nhf_percent: 0,
  taxable_supplies: 0,
  input_vat: 0,
  gross_profit: 0,
  allowable_expenses: 0,
};

export default function CalculatorPage() {
  const { user } = useAuth();

  const resultRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<TaxType>("paye");
  const [inputs, setInputs] = useState<any>(initialInputs);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  useEffect(() => {
    console.log("[Calculator] Component mounted successfully");
  }, []);

  const handleInputChange = (field: string, value: string) => {
    const numValue = value === "" ? 0 : parseFloat(value) || 0;
    setInputs((previous: any) => ({ ...previous, [field]: numValue }));
    setError(null);
    console.log(`[Calculator] Input changed: ${field} = ${numValue}`);
  };

  const resetPAYEInputs = () => {
    setInputs((previous: any) => ({
      ...previous,
      monthly_gross_income: 0,
      pension_contribution: 0,
      pension_percent: 0,
      nhf: 0,
      nhf_percent: 0,
    }));
    setResult(null);
    setError(null);
  };

  const inputValue = (field: string) => {
    const value = Number(inputs[field]) || 0;
    return value === 0 ? "" : value;
  };

  const formatNaira = (value: number) =>
    `₦${(Number(value) || 0).toLocaleString("en-NG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;

  const calculate = async () => {
    const pensionAmount = Number(inputs.pension_contribution) || 0;
    const pensionPercent = Number(inputs.pension_percent) || 0;
    const nhfAmount = Number(inputs.nhf) || 0;
    const nhfPercent = Number(inputs.nhf_percent) || 0;

    if (activeTab === "paye" && pensionAmount > 0 && pensionPercent > 0) {
      setResult(null);
      setError("Please use either Pension Amount or Pension Percent, not both. Clear one pension field and try again.");
      return;
    }

    if (activeTab === "paye" && nhfAmount > 0 && nhfPercent > 0) {
      setResult(null);
      setError("Please use either NHF Amount or NHF Percent, not both. Clear one NHF field and try again.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    console.log(`[Calculator] Starting calculation for ${activeTab} with inputs:`, inputs);

    try {
      const response = await fetch('/api/tax/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeTab, inputs }),
      });
      const res = await response.json();
      console.log("[Calculator] API response received:", res);
      if (res.ok) {
        setResult(res);
      } else {
        setError(res.error || "Calculation failed");
      }
    } catch (err: any) {
      console.error("[Calculator] Exception during calculation:", err);
      setError(err?.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  const tooltip = (text: string) => ({ title: text });

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    fontSize: 16,
    outline: "none",
    transition: "border 0.2s",
  };

  const disabledInputStyle: React.CSSProperties = {
    ...inputStyle,
    opacity: 0.55,
    cursor: "not-allowed",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 8,
    fontWeight: 800,
    fontSize: 14,
    color: "var(--text)",
  };

  const formGroupStyle: React.CSSProperties = {
    display: "grid",
    gap: 8,
  };

  const twoColumnStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
  };

  const helperTextStyle: React.CSSProperties = {
    fontSize: 13,
    color: "var(--text-muted)",
    lineHeight: 1.5,
  };

  const warningTextStyle: React.CSSProperties = {
    fontSize: 13,
    color: "#f59e0b",
    lineHeight: 1.5,
    fontWeight: 800,
  };

  const resetButtonStyle: React.CSSProperties = {
    justifySelf: "start",
    padding: "8px 14px",
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "var(--surface-soft)",
    color: "var(--text)",
    fontWeight: 800,
    cursor: "pointer",
  };

  const renderPAYEForm = () => {
    const monthlyGross = Number(inputs.monthly_gross_income) || 0;
    const pensionAmount = Number(inputs.pension_contribution) || 0;
    const pensionPercent = Number(inputs.pension_percent) || 0;
    const nhfAmount = Number(inputs.nhf) || 0;
    const nhfPercent = Number(inputs.nhf_percent) || 0;
    const computedPension = pensionAmount || (monthlyGross * pensionPercent / 100);
    const computedNhf = nhfAmount || (monthlyGross * nhfPercent / 100);

    return (
      <div style={{ display: "grid", gap: 24 }}>
        <div style={formGroupStyle}>
          <label style={labelStyle} {...tooltip("Your total monthly income before any deductions")}>Monthly Gross Income (₦)</label>
          <input
            type="number"
            style={inputStyle}
            value={inputValue("monthly_gross_income")}
            onChange={(e) => handleInputChange("monthly_gross_income", e.target.value)}
            placeholder="e.g., 500000"
          />
        </div>

        <div style={{ display: "grid", gap: 12, padding: 16, borderRadius: 16, border: "1px solid var(--border)", background: "var(--surface-soft)" }}>
          <div>
            <div style={{ fontWeight: 900, marginBottom: 4 }}>Pension Deduction</div>
            <div style={helperTextStyle}>Choose either actual monthly amount or percentage of gross salary. Do not enter both for pension.</div>
          </div>
          <div style={twoColumnStyle}>
            <div style={formGroupStyle}>
              <label style={labelStyle} {...tooltip("Monthly pension amount deducted by employer")}>Pension Amount (₦)</label>
              <input
                type="number"
                style={pensionPercent > 0 ? disabledInputStyle : inputStyle}
                value={inputValue("pension_contribution")}
                disabled={pensionPercent > 0}
                onChange={(e) => handleInputChange("pension_contribution", e.target.value)}
                placeholder={pensionPercent > 0 ? "Clear percent first" : "e.g., 32000"}
              />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle} {...tooltip("Pension percentage of monthly gross salary")}>Pension Percent (%)</label>
              <input
                type="number"
                step="0.01"
                style={pensionAmount > 0 ? disabledInputStyle : inputStyle}
                value={inputValue("pension_percent")}
                disabled={pensionAmount > 0}
                onChange={(e) => handleInputChange("pension_percent", e.target.value)}
                placeholder={pensionAmount > 0 ? "Clear amount first" : "e.g., 8"}
              />
            </div>
          </div>
          <div style={helperTextStyle}>Pension used for this calculation: <strong>{formatNaira(computedPension)}</strong> monthly.</div>
          {pensionAmount > 0 && <div style={warningTextStyle}>Pension percent is locked because Pension Amount is being used.</div>}
          {pensionPercent > 0 && <div style={warningTextStyle}>Pension amount is locked because Pension Percent is being used.</div>}
        </div>

        <div style={{ display: "grid", gap: 12, padding: 16, borderRadius: 16, border: "1px solid var(--border)", background: "var(--surface-soft)" }}>
          <div>
            <div style={{ fontWeight: 900, marginBottom: 4 }}>NHF Deduction</div>
            <div style={helperTextStyle}>Choose either actual monthly amount or percentage of gross salary. Do not enter both for NHF.</div>
          </div>
          <div style={twoColumnStyle}>
            <div style={formGroupStyle}>
              <label style={labelStyle} {...tooltip("Monthly National Housing Fund amount deducted by employer")}>NHF Amount (₦)</label>
              <input
                type="number"
                style={nhfPercent > 0 ? disabledInputStyle : inputStyle}
                value={inputValue("nhf")}
                disabled={nhfPercent > 0}
                onChange={(e) => handleInputChange("nhf", e.target.value)}
                placeholder={nhfPercent > 0 ? "Clear percent first" : "e.g., 17500"}
              />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle} {...tooltip("NHF percentage of monthly gross salary")}>NHF Percent (%)</label>
              <input
                type="number"
                step="0.01"
                style={nhfAmount > 0 ? disabledInputStyle : inputStyle}
                value={inputValue("nhf_percent")}
                disabled={nhfAmount > 0}
                onChange={(e) => handleInputChange("nhf_percent", e.target.value)}
                placeholder={nhfAmount > 0 ? "Clear amount first" : "e.g., 2.5"}
              />
            </div>
          </div>
          <div style={helperTextStyle}>NHF used for this calculation: <strong>{formatNaira(computedNhf)}</strong> monthly.</div>
          {nhfAmount > 0 && <div style={warningTextStyle}>NHF percent is locked because NHF Amount is being used.</div>}
          {nhfPercent > 0 && <div style={warningTextStyle}>NHF amount is locked because NHF Percent is being used.</div>}
        </div>

        <button type="button" onClick={resetPAYEInputs} style={resetButtonStyle}>Clear PAYE inputs</button>
      </div>
    );
  };

  const renderVATForm = () => (
    <div style={{ display: "grid", gap: 24 }}>
      <div style={formGroupStyle}>
        <label style={labelStyle} {...tooltip("Total value of taxable goods/services supplied")}>Taxable Supplies (₦)</label>
        <input
          type="number"
          style={inputStyle}
          value={inputValue("taxable_supplies")}
          onChange={(e) => handleInputChange("taxable_supplies", e.target.value)}
        />
      </div>
      <div style={formGroupStyle}>
        <label style={labelStyle} {...tooltip("VAT already paid on purchases (deductible)")}>Input VAT (₦)</label>
        <input
          type="number"
          style={inputStyle}
          value={inputValue("input_vat")}
          onChange={(e) => handleInputChange("input_vat", e.target.value)}
          placeholder="Optional"
        />
      </div>
    </div>
  );

  const renderCITForm = () => (
    <div style={{ display: "grid", gap: 24 }}>
      <div style={formGroupStyle}>
        <label style={labelStyle} {...tooltip("Company annual turnover/revenue used to determine small, medium, or large company CIT rate")}>Annual Revenue / Turnover (₦)</label>
        <input
          type="number"
          style={inputStyle}
          value={inputValue("gross_profit")}
          onChange={(e) => handleInputChange("gross_profit", e.target.value)}
          placeholder="e.g., 30000000"
        />
        <div style={helperTextStyle}>CIT rate is based on annual revenue/turnover: small company ≤ ₦25m, medium company > ₦25m to ₦100m, large company > ₦100m.</div>
      </div>
      <div style={formGroupStyle}>
        <label style={labelStyle} {...tooltip("Allowable business expenses deducted from revenue to estimate taxable profit")}>Allowable Expenses (₦)</label>
        <input
          type="number"
          style={inputStyle}
          value={inputValue("allowable_expenses")}
          onChange={(e) => handleInputChange("allowable_expenses", e.target.value)}
          placeholder="e.g., 10000000"
        />
      </div>
    </div>
  );

  return (
    <AppShell title="Tax Calculator" subtitle="Compute PAYE, VAT, and Company Income Tax instantly.">
      <SectionStack>
        <WorkspaceSectionCard title="Select Tax Type">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
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
                  padding: "12px 28px",
                  borderRadius: 40,
                  border: "none",
                  background: activeTab === type ? "#3b82f6" : "var(--surface-soft)",
                  color: activeTab === type ? "white" : "var(--text)",
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: activeTab === type ? "0 4px 12px rgba(59,130,246,0.3)" : "none",
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
              marginTop: 32,
              width: "100%",
              padding: "16px",
              borderRadius: 16,
              border: "none",
              background: loading ? "#94a3b8" : "#3b82f6",
              color: "white",
              fontWeight: 900,
              fontSize: 16,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            {loading ? (
              <>
                <span className="loading-spinner" />
                Calculating...
              </>
            ) : (
              "Calculate Tax"
            )}
          </button>
        </WorkspaceSectionCard>

        {error && (
          <WorkspaceSectionCard title="Error">
            <div style={{ padding: 18, background: "rgba(244,63,94,0.1)", borderRadius: 16, color: "#dc2626", borderLeft: "4px solid #dc2626" }}>
              <strong>Error:</strong> {error}
              <div style={{ fontSize: 13, marginTop: 8, color: "var(--text-muted)" }}>Check the browser console (F12) for detailed logs.</div>
            </div>
          </WorkspaceSectionCard>
        )}

        {result && result.ok && (
          <div ref={resultRef}>
            <WorkspaceSectionCard title="Result">
              <div style={{ padding: 20, background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))", borderRadius: 20, border: "1px solid rgba(16,185,129,0.2)" }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#10b981", marginBottom: 8 }}>📊 Tax Summary</div>
                <div style={{ fontSize: 16, lineHeight: 1.7, whiteSpace: "pre-line" }}>{result.answer}</div>
                <button
                  onClick={() => {
                    const pdf = generateTaxPDF({
                      taxType: activeTab,
                      inputs,
                      result: result.answer,
                      userName: user?.display_name || user?.email || undefined,
                      userEmail: user?.email || undefined,
                    });
                    pdf.save(`${activeTab.toUpperCase()}_calculation_${Date.now()}.pdf`);
                  }}
                  style={{
                    marginTop: 16,
                    padding: "8px 16px",
                    background: "#3b82f6",
                    border: "none",
                    borderRadius: 12,
                    color: "white",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Download PDF Report
                </button>
              </div>
            </WorkspaceSectionCard>
          </div>
        )}
      </SectionStack>
    </AppShell>
  );
}
