"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/app-shell";
import { SectionStack } from "@/components/page-layout";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { apiJson } from "@/lib/api";
import { useWorkspaceState } from "@/hooks/useWorkspaceState";
import { useAuth } from "@/lib/auth";

type TaxType = "paye" | "vat" | "cit";
type Step = 1 | 2 | 3 | 4;

export default function FileTaxPage() {
  const router = useRouter();
  const { refreshSession, user, hasSession, authReady } = useAuth();
  
  // Get accountId from workspace state
  const { accountId, busy: workspaceLoading, errorDetails, status } = useWorkspaceState({
    refreshSession,
    autoLoad: true,
    includeAccount: true,
  });

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [taxType, setTaxType] = useState<TaxType>("paye");
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
  const [debugInfo, setDebugInfo] = useState<any>({});

  // Debug logging
  useEffect(() => {
    const debug = {
      authReady,
      workspaceLoading,
      hasSession,
      accountId,
      isLoading,
      errorDetails,
      status,
    };
    setDebugInfo(debug);
    console.log("🔍 [FileTaxPage] Debug:", debug);
  }, [authReady, workspaceLoading, hasSession, accountId, isLoading, errorDetails, status]);

  // Wait for auth to be ready and accountId to load
  useEffect(() => {
    if (authReady && !workspaceLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [authReady, workspaceLoading]);

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
    console.log("🔍 [submitFiling] Starting - AccountId:", accountId, "HasSession:", hasSession);
    
    if (!hasSession) {
      setError("No active session. Please log in first.");
      return;
    }
    
    if (!accountId) {
      setError(`Account ID not loaded. Debug: ${JSON.stringify(debugInfo)}`);
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
      
      console.log("🔍 [submitFiling] Sending data:", filingData);
      
      const response = await apiJson("tax/file", {
        method: "POST",
        body: JSON.stringify(filingData),
        useAuthToken: false,
      });
      
      console.log("🔍 [submitFiling] Response:", response);
      
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
      console.error("❌ [submitFiling] Error:", err);
      if (err.status === 401) {
        setError("Session expired. Please log out and log back in.");
      } else {
        setError(err.message || "Submission failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <AppShell title="File Your Taxes" subtitle="Loading your account...">
        <SectionStack>
          <WorkspaceSectionCard title="Loading">
            <div style={{ textAlign: "center", padding: "40px" }}>
              Loading your account information...
              <div style={{ fontSize: "12px", marginTop: "16px", color: "var(--text-muted)" }}>
                Status: {status}
              </div>
            </div>
          </WorkspaceSectionCard>
        </SectionStack>
      </AppShell>
    );
  }

  // Show login required state
  if (!hasSession) {
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

  // Show error if accountId is still not loaded
  if (!accountId) {
    return (
      <AppShell title="File Your Taxes" subtitle="Account Loading Issue">
        <SectionStack>
          <WorkspaceSectionCard title="Account Not Loaded">
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p style={{ color: "#dc2626", marginBottom: "16px" }}>❌ Could not load account information</p>
              <details style={{ textAlign: "left", background: "var(--surface-soft)", padding: "16px", borderRadius: "8px", marginTop: "16px" }}>
                <summary style={{ cursor: "pointer", fontWeight: "bold" }}>Debug Information</summary>
                <pre style={{ fontSize: "11px", marginTop: "12px", overflow: "auto", maxHeight: "300px" }}>
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
              <button
                onClick={() => window.location.reload()}
                style={{ padding: "10px 20px", background: "#3b82f6", color: "white", border: "none", borderRadius: 8, cursor: "pointer", marginTop: 16 }}
              >
                Refresh Page
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
      <p style={{ marginBottom: 16, color: "var(--text-muted)" }}>
        Select the type of tax you want to file.
      </p>
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
      <div>
        <label>Monthly Gross Income (₦)</label>
        <input 
          type="number" 
          placeholder="Enter monthly gross income"
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }} 
          onChange={(e) => handleInputChange("monthly_gross_income", e.target.value)} 
        />
      </div>
      <div>
        <label>Pension Contribution (₦)</label>
        <input 
          type="number" 
          placeholder="Enter pension contribution"
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }} 
          onChange={(e) => handleInputChange("pension_contribution", e.target.value)} 
        />
      </div>
      <div>
        <label>NHF Contribution (₦)</label>
        <input 
          type="number" 
          placeholder="Enter NHF contribution"
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }} 
          onChange={(e) => handleInputChange("nhf", e.target.value)} 
        />
      </div>
    </div>
  );

  const renderVATDetails = () => (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <label>Taxable Supplies (₦)</label>
        <input 
          type="number" 
          placeholder="Enter taxable supplies"
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }} 
          onChange={(e) => handleInputChange("taxable_supplies", e.target.value)} 
        />
      </div>
      <div>
        <label>Input VAT (₦)</label>
        <input 
          type="number" 
          placeholder="Enter input VAT"
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }} 
          onChange={(e) => handleInputChange("input_vat", e.target.value)} 
        />
      </div>
    </div>
  );

  const renderCITDetails = () => (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <label>Gross Profit (₦)</label>
        <input 
          type="number" 
          placeholder="Enter gross profit"
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }} 
          onChange={(e) => handleInputChange("gross_profit", e.target.value)} 
        />
      </div>
      <div>
        <label>Allowable Expenses (₦)</label>
        <input 
          type="number" 
          placeholder="Enter allowable expenses"
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }} 
          onChange={(e) => handleInputChange("allowable_expenses", e.target.value)} 
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <
