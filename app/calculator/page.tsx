"use client";

import React, { useState } from "react";
import AppShell from "@/components/app-shell";
import { SectionStack } from "@/components/page-layout";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { apiJson } from "@/lib/api";
import jsPDF from "jspdf";
import "jspdf-autotable";

type TaxType = "paye" | "vat" | "cit";

export default function CalculatorPage() {
  const [activeTab, setActiveTab] = useState<TaxType>("paye");
  const [inputs, setInputs] = useState<any>({});
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

  const exportPDF = () => {
    if (!result || !result.ok) return;
    const doc = new jsPDF();
    doc.text("Tax Calculation Report", 20, 20);
    doc.text(`Tax Type: ${activeTab.toUpperCase()}`, 20, 30);
    doc.text(`Inputs: ${JSON.stringify(inputs)}`, 20, 40);
    doc.text(`Result: ${result.answer}`, 20, 50);
    doc.save("tax_calculation.pdf");
  };

  const renderPAYEForm = () => (
    <div className="grid gap-4">
      <div>
        <label>Monthly Gross Income (₦)</label>
        <input type="number" className="w-full p-2 border rounded" onChange={(e) => handleInputChange("monthly_gross_income", e.target.value)} />
      </div>
      <div>
        <label>Pension Contribution (₦)</label>
        <input type="number" className="w-full p-2 border rounded" onChange={(e) => handleInputChange("pension_contribution", e.target.value)} />
      </div>
      <div>
        <label>NHF Contribution (₦)</label>
        <input type="number" className="w-full p-2 border rounded" onChange={(e) => handleInputChange("nhf", e.target.value)} />
      </div>
    </div>
  );

  const renderVATForm = () => (
    <div className="grid gap-4">
      <div>
        <label>Taxable Supplies (₦)</label>
        <input type="number" className="w-full p-2 border rounded" onChange={(e) => handleInputChange("taxable_supplies", e.target.value)} />
      </div>
      <div>
        <label>Input VAT (₦)</label>
        <input type="number" className="w-full p-2 border rounded" onChange={(e) => handleInputChange("input_vat", e.target.value)} />
      </div>
    </div>
  );

  const renderCITForm = () => (
    <div className="grid gap-4">
      <div>
        <label>Gross Profit (₦)</label>
        <input type="number" className="w-full p-2 border rounded" onChange={(e) => handleInputChange("gross_profit", e.target.value)} />
      </div>
      <div>
        <label>Allowable Expenses (₦)</label>
        <input type="number" className="w-full p-2 border rounded" onChange={(e) => handleInputChange("allowable_expenses", e.target.value)} />
      </div>
    </div>
  );

  return (
    <AppShell title="Tax Calculator" subtitle="Compute PAYE, VAT, and Company Income Tax instantly.">
      <SectionStack>
        <WorkspaceSectionCard title="Select Tax Type">
          <div className="flex gap-4 border-b pb-2">
            {["paye", "vat", "cit"].map((type) => (
              <button
                key={type}
                onClick={() => setActiveTab(type as TaxType)}
                className={`px-4 py-2 rounded-t-lg ${activeTab === type ? "bg-blue-600 text-white" : "bg-gray-200"}`}
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
          <button onClick={calculate} disabled={loading} className="mt-6 w-full bg-green-600 text-white py-2 rounded">
            {loading ? "Calculating..." : "Calculate Tax"}
          </button>
        </WorkspaceSectionCard>

        {result && (
          <WorkspaceSectionCard title="Result">
            {result.ok ? (
              <>
                <div className="p-4 bg-gray-100 rounded">{result.answer}</div>
                <button onClick={exportPDF} className="mt-4 bg-blue-600 text-white py-2 px-4 rounded">Export as PDF</button>
              </>
            ) : (
              <div className="text-red-600">{result.error}</div>
            )}
          </WorkspaceSectionCard>
        )}
      </SectionStack>
    </AppShell>
  );
}
