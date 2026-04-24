import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface TaxReportData {
  taxType: string;
  inputs: Record<string, number>;
  result: string;
  submittedAt?: string;
  reference?: string;
  userName?: string;
  userEmail?: string;
}

export function generateTaxPDF(data: TaxReportData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 20;

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('Naija Tax Guide', margin, y);
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Tax Calculation Report', margin, y);
  y += 6;
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
  y += 12;

  // User info
  if (data.userName || data.userEmail) {
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('User Information', margin, y);
    y += 6;
    doc.setFontSize(10);
    if (data.userName) doc.text(`Name: ${data.userName}`, margin, y);
    if (data.userEmail) doc.text(`Email: ${data.userEmail}`, margin, data.userName ? y + 6 : y);
    y += data.userName ? 18 : 12;
  }

  // Reference & submission date (for filings)
  if (data.reference) {
    doc.text(`Filing Reference: ${data.reference}`, margin, y);
    y += 6;
  }
  if (data.submittedAt) {
    doc.text(`Submitted: ${new Date(data.submittedAt).toLocaleString()}`, margin, y);
    y += 12;
  }

  // Tax Type
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(`Tax Type: ${data.taxType.toUpperCase()}`, margin, y);
  y += 10;

  // Inputs table
  const tableData = Object.entries(data.inputs).map(([key, value]) => [
    key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    `₦${value.toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Parameter', 'Value']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Result
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Calculation Result', margin, y);
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);

  // Split result text into lines
  const splitResult = doc.splitTextToSize(data.result, pageWidth - margin * 2);
  doc.text(splitResult, margin, y);
  y += splitResult.length * 5 + 10;

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text('This is an automatically generated report. For official tax advice, consult a professional.', margin, doc.internal.pageSize.getHeight() - 15);
  doc.text(`© ${new Date().getFullYear()} Naija Tax Guide – BMS SparkVision Hub`, margin, doc.internal.pageSize.getHeight() - 10);

  return doc;
}
