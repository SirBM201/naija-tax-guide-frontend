"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/app-shell";
import { SectionStack } from "@/components/page-layout";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { apiJson } from "@/lib/api";

type TaxType = "paye" | "vat" | "cit";
type Step = 1 | 2 | 3 | 4;

export default function FileTaxPage() {
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [taxType, setTaxType] = useState<TaxType>("paye");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [inputs, setInputs] = useState<any>({
    monthly_gross_income: 0,
    pension_contribution: 0,
    nhf: 0,
    taxable_supplies: 0,
    input_vat: 0,
    gross_profit: 0,
    allowable_expenses: 0,
  });
  const [documents, setDocuments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication and get account ID
  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      try {
        console.log("🔍 Checking authentication...");
        
        // First, check if we have a session by calling /web/auth/me
        const response = await apiJson<{ ok: boolean; account_id?: string }>("web/auth/me", {
          method: "GET",
          useAuthToken: false,
        });
        
        console.log("📡 Auth response:", response);
        
        if (response?.ok && response?.account_id) {
          console.log("✅ Authenticated! Account ID:", response.account_id);
          setAccountId(response.account_id);
          setIsAuthenticated(true);
        } else {
          console.log("❌ Not authenticated");
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error("❌ Auth check error:", err);
        setIsAuthenticated(false);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    checkAuth();
    
    return () => {
      mounted = false;
    };
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setInputs({ ...inputs, [field]: parseFloat(value) || 0 });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(Array.from(e.target.files));
    }
  };

  const nextStep = () => {
    setCurrentStep((prev) => (prev + 1) as Step);
    setError(null);
  };

  const prevStep = () => {
    setCurrentStep((prev) => (prev - 1) as Step);
    setError(null);
  };

  const submitFiling = async () => {
    if (!isAuthenticated) {
      setError("Please log in to file taxes.");
      return;
    }
    
    if (!accountId) {
      setError("Account not loaded. Please refresh.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const filingData = {
        taxType,
        inputs,
        documents: documents.map(d => ({ name: d.name, size: d.size, type: d.type })),
        userId: accountId,
      };
      
      console.log("📤 Filing data:", filingData);
      
      const response = await apiJson("tax/file", {
        method: "POST",
        body: JSON.stringify(filingData),
        useAuthToken: false,
      });
      
      console.log("📥 Filing response:", response);
      
      if (response.ok) {
        const summaryData = {
          taxType,
          inputs,
          documentsCount: documents.length,
          reference: response.reference,
          submittedAt: response.submittedAt,
        };
        sessionStorage.setItem("lastFilingSummary", JSON.stringify(summaryData));
        router.push("/file/summary");
      } else {
        setError(response.error || "Submission failed");
      }
    } catch (err: any) {
      console.error("❌ Filing error:", err);
      setError(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <AppShell title="File Your Taxes" subtitle="Loading...">
        <SectionStack>
          <WorkspaceSectionCard title="Loading">
            <div style={{ textAlign: "center", padding: "40px" }}>
              Loading your account...
            </div>
          </WorkspaceSectionCard>
        </SectionStack>
      </AppShell>
    );
  }

  // Show login required state
  if (!isAuthenticated) {
    return (
      <AppShell title="File Your Taxes" subtitle="Authentication Required">
        <SectionStack>
          <WorkspaceSectionCard title="Not Logged In">
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p>Please log in to file your taxes.</p>
              <button
                onClick={() => router.push("/login")}
                style={{ padding: "10px 20px", background: "#3b82f6", color: "white", border: "none", borderRadius: 8, cursor: "pointer", marginTop: 16 }}
              >
                Go to Login
              </button>
            </div>
          </WorkspaceSectionCard>
        </SectionStack>
      </AppShell>
    );
  }

  const renderStepIndicator = () => (
    <div style={{ display: "flex", gap: 8, marginBottom: 24, justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
      {[1, 2, 3, 4].map((step) => (
        <div
          key={step}
          style={{
            flex: 1,
            textAlign: "center",
            padding: 8,
            borderRadius: 20,
            background: currentStep >= step ? "var(--accent)" : "var(--surface-soft)",
            color: currentStep >= step ? "white" : "var(--text-muted)",
            fontWeight: 800,
            fontSize: 13,
          }}
        >
          Step {step}: {step === 1 ? "Tax Type" : step === 2 ? "Details" : step === 3 ? "Documents" : "Confirm"}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div>
      <p style={{ marginBottom: 16, color: "var(--text-muted)" }}>Select the type of tax you want to file.</p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {["paye", "vat", "cit"].map((type) => (
          <button
            key={type}
            onClick={() => setTaxType(type as TaxType)}
            style={{
              padding: "12px 24px",
              borderRadius: 40,
              border: "1px solid var(--border)",
              background: taxType === type ? "#3b82f6" : "var(--surface-soft)",
              color: taxType === type ? "white" : "var(--text)",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {type.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );

  const renderPAYEDetails = () => (
    <div style={{ display: "grid", gap: 16 }}>
      <div><label>Monthly Gross Income (₦)</label><input type="number" style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }} onChange={(e) => handleInputChange("monthly_gross_income", e.target.value)} /></div>
      <div><label>Pension Contribution (₦)</label><input type="number" style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }} onChange={(e) => handleInputChange("pension_contribution", e.target.value)} /></div>
      <div><label>NHF Contribution (₦)</label><input type="number" style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }} onChange={(e) => handleInputChange("nhf", e.target.value)} /></div>
    </div>
  );

  const renderVATDetails = () => (
    <div style={{ display: "grid", gap: 16 }}>
      <div><label>Taxable Supplies (₦)</label><input type="number" style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }} onChange={(e) => handleInputChange("taxable_supplies", e.target.value)} /></div>
      <div><label>Input VAT (₦)</label><input type="number" style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }} onChange={(e) => handleInputChange("input_vat", e.target.value)} /></div>
    </div>
  );

  const renderCITDetails = () => (
    <div style={{ display: "grid", gap: 16 }}>
      <div><label>Gross Profit (₦)</label><input type="number" style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }} onChange={(e) => handleInputChange("gross_profit", e.target.value)} /></div>
      <div><label>Allowable Expenses (₦)</label><input type="number" style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }} onChange={(e) => handleInputChange("allowable_expenses", e.target.value)} /></div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <p style={{ marginBottom: 16, color: "var(--text-muted)" }}>Enter your financial details for {taxType.toUpperCase()}.</p>
      {taxType === "paye" && renderPAYEDetails()}
      {taxType === "vat" && renderVATDetails()}
      {taxType === "cit" && renderCITDetails()}
    </div>
  );

  const renderStep3 = () => (
    <div>
      <p style={{ marginBottom: 16, color: "var(--text-muted)" }}>Upload supporting documents (optional). Accepted: PDF, JPG, PNG.</p>
      <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} style={{ marginBottom: 16 }} />
      {documents.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <strong>Uploaded files:</strong>
          <ul>{documents.map((doc, idx) => (<li key={idx}>{doc.name} ({(doc.size / 1024).toFixed(1)} KB)</li>))}</ul>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div>
      <p style={{ marginBottom: 16 }}>Review your filing details before submitting.</p>
      <div style={{ background: "var(--surface-soft)", padding: 16, borderRadius: 16, marginBottom: 16 }}>
        <strong>Tax Type:</strong> {taxType.toUpperCase()}<br />
        <strong>Details:</strong> <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: "12px" }}>{JSON.stringify(inputs, null, 2)}</pre><br />
        <strong>Documents:</strong> {documents.length} file(s)
      </div>
      {error && <div style={{ color: "#dc2626", marginBottom: 16, padding: 12, background: "rgba(220,38,38,0.1)", borderRadius: 8 }}>❌ {error}</div>}
      <button onClick={submitFiling} disabled={submitting} style={{ padding: "12px 24px", background: "#10b981", border: "none", borderRadius: 12, color: "white", fontWeight: 800, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1 }}>
        {submitting ? "Submitting..." : "Confirm & Submit Filing"}
      </button>
    </div>
  );

  return (
    <AppShell title="File Your Taxes" subtitle="Guided step-by-step tax filing for PAYE, VAT, and Company Income Tax.">
      <SectionStack>
        <WorkspaceSectionCard title="Filing Wizard">
          {renderStepIndicator()}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep !== 4 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
              {currentStep > 1 && (<button onClick={prevStep} style={{ padding: "10px 20px", background: "var(--surface-soft)", border: "1px solid var(--border)", borderRadius: 12, cursor: "pointer" }}>Back</button>)}
              {currentStep < 3 && (<button onClick={nextStep} style={{ padding: "10px 20px", background: "#3b82f6", border: "none", borderRadius: 12, color: "white", fontWeight: 800, cursor: "pointer", marginLeft: "auto" }}>Next</button>)}
              {currentStep === 3 && (<button onClick={nextStep} style={{ padding: "10px 20px", background: "#3b82f6", border: "none", borderRadius: 12, color: "white", fontWeight: 800, cursor: "pointer", marginLeft: "auto" }}>Review & Submit</button>)}
            </div>
          )}
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
