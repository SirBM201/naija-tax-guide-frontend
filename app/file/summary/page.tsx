"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/app-shell";
import { SectionStack } from "@/components/page-layout";
import WorkspaceSectionCard from "@/components/workspace-section-card";
import { generateTaxPDF } from "@/lib/pdf-generator";
import { useAuth } from "@/lib/auth";

interface FilingSummary {
  taxType: string;
  inputs: any;
  documentsCount: number;
  reference: string;
  submittedAt: string;
}

// This inner component contains the main logic and uses useSearchParams
function FilingSummaryContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [summary, setSummary] = useState<FilingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("lastFilingSummary");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSummary(parsed);
      } catch (e) {
        console.error("Failed to parse stored filing summary", e);
      }
    }
    setLoading(false);
  }, []);

  const handleDownloadReceipt = () => {
    if (!summary) return;
    const pdf = generateTaxPDF({
      taxType: summary.taxType,
      inputs: summary.inputs,
      result: `Filing submitted successfully.\nReference: ${summary.reference}\nStatus: Submitted`,
      submittedAt: summary.submittedAt,
      reference: summary.reference,
      userName: user?.display_name || user?.email || undefined,
      userEmail: user?.email || undefined,
    });
    pdf.save(`filing_${summary.taxType}_${summary.reference}.pdf`);
  };

  if (loading) {
    return <div className="flex justify-center py-12">Loading summary...</div>;
  }

  if (!summary) {
    return (
      <div>
        <p>It seems you haven't submitted a filing recently.</p>
        <button
          onClick={() => router.push("/file")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Go to File Taxes
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-green-50 p-4 border border-green-200">
        <h3 className="text-lg font-semibold text-green-800">✓ Filing Submitted Successfully</h3>
        <p className="text-green-700 mt-1">Your tax return has been received.</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-3">Summary Details</h4>
        <div className="grid gap-2 text-sm">
          <div>
            <span className="font-medium">Tax Type:</span> {summary.taxType.toUpperCase()}
          </div>
          <div>
            <span className="font-medium">Reference:</span> {summary.reference}
          </div>
          <div>
            <span className="font-medium">Submitted At:</span>{" "}
            {new Date(summary.submittedAt).toLocaleString()}
          </div>
          <div>
            <span className="font-medium">Documents:</span> {summary.documentsCount} file(s)
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-3">Financial Details</h4>
        <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
          {JSON.stringify(summary.inputs, null, 2)}
        </pre>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleDownloadReceipt}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Download Filing Receipt (PDF)
        </button>
        <button
          onClick={() => router.push("/history")}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          View Filing History
        </button>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

// The page component wraps the content in Suspense
export default function FilingSummaryPage() {
  return (
    <AppShell title="Filing Summary" subtitle="Review your submitted tax filing details">
      <SectionStack>
        <WorkspaceSectionCard title="Filing Confirmation">
          <Suspense fallback={<div>Loading summary...</div>}>
            <FilingSummaryContent />
          </Suspense>
        </WorkspaceSectionCard>
      </SectionStack>
    </AppShell>
  );
}
