import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  console.log('[API] /api/tax/calculate received request');
  try {
    const body = await req.json();
    console.log('[API] Request body:', body);
    const { type, inputs } = body;

    let answer = '';

    if (type === 'paye') {
      const gross = inputs.monthly_gross_income || 0;
      const pension = inputs.pension_contribution || 0;
      const nhf = inputs.nhf || 0;
      const taxable = gross - pension - nhf;
      let tax = 0;
      if (taxable <= 300000) tax = 0;
      else if (taxable <= 600000) tax = (taxable - 300000) * 0.07;
      else if (taxable <= 1100000) tax = 21000 + (taxable - 600000) * 0.11;
      else if (taxable <= 1600000) tax = 76000 + (taxable - 1100000) * 0.15;
      else if (taxable <= 3200000) tax = 151000 + (taxable - 1600000) * 0.19;
      else tax = 455000 + (taxable - 3200000) * 0.24;
      answer = `Your estimated PAYE tax per month is ₦${tax.toLocaleString()}. Annual: ₦${(tax * 12).toLocaleString()}.`;
    }
    else if (type === 'vat') {
      const supplies = inputs.taxable_supplies || 0;
      const inputVat = inputs.input_vat || 0;
      const vatDue = supplies * 0.075 - inputVat;
      answer = `VAT payable is ₦${Math.max(0, vatDue).toLocaleString()}.`;
    }
    else if (type === 'cit') {
      const profit = inputs.gross_profit || 0;
      const expenses = inputs.allowable_expenses || 0;
      const taxableProfit = Math.max(0, profit - expenses);
      const citDue = taxableProfit * 0.2;
      answer = `Company Income Tax (CIT) payable is ₦${citDue.toLocaleString()}.`;
    }
    else {
      return NextResponse.json({ ok: false, error: 'Invalid tax type' }, { status: 400 });
    }

    console.log('[API] Calculation result:', { ok: true, answer });
    return NextResponse.json({ ok: true, answer });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
