import { NextRequest, NextResponse } from 'next/server';

type PayeResult = {
  annualGross: number;
  consolidatedRelief: number;
  payrollDeductions: number;
  chargeableIncome: number;
  annualTax: number;
  monthlyTax: number;
  netMonthlyPay: number;
};

function toNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function formatNaira(value: number): string {
  return `₦${value.toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function calculateAnnualPaye(chargeableIncome: number): number {
  const bands: Array<[number, number]> = [
    [300000, 0.07],
    [300000, 0.11],
    [500000, 0.15],
    [500000, 0.19],
    [1600000, 0.21],
    [Number.POSITIVE_INFINITY, 0.24],
  ];

  let remaining = Math.max(0, chargeableIncome);
  let annualTax = 0;

  for (const [bandAmount, rate] of bands) {
    if (remaining <= 0) break;
    const taxableInBand = Math.min(remaining, bandAmount);
    annualTax += taxableInBand * rate;
    remaining -= taxableInBand;
  }

  return annualTax;
}

function calculatePAYE(monthlyGross: number, monthlyPension: number = 0, monthlyNhf: number = 0): PayeResult {
  const annualGross = monthlyGross * 12;
  const annualPension = monthlyPension * 12;
  const annualNhf = monthlyNhf * 12;
  const consolidatedRelief = Math.max(200000, annualGross * 0.01) + annualGross * 0.2;
  const payrollDeductions = annualPension + annualNhf;
  const chargeableIncome = Math.max(0, annualGross - consolidatedRelief - payrollDeductions);
  const annualTax = calculateAnnualPaye(chargeableIncome);
  const monthlyTax = annualTax / 12;
  const netMonthlyPay = Math.max(0, monthlyGross - monthlyPension - monthlyNhf - monthlyTax);

  return {
    annualGross,
    consolidatedRelief,
    payrollDeductions,
    chargeableIncome,
    annualTax,
    monthlyTax,
    netMonthlyPay,
  };
}

export async function POST(req: NextRequest) {
  console.log('[API] /api/tax/calculate received request');
  try {
    const body = await req.json();
    console.log('[API] Request body:', body);
    const { type, inputs = {} } = body;

    let answer = '';
    let breakdown: Record<string, number> | undefined;

    if (type === 'paye') {
      const monthlyGross = toNumber(inputs.monthly_gross_income);
      const monthlyPension = toNumber(inputs.pension_contribution);
      const monthlyNhf = toNumber(inputs.nhf);
      const result = calculatePAYE(monthlyGross, monthlyPension, monthlyNhf);

      breakdown = {
        annual_gross_income: result.annualGross,
        consolidated_relief: result.consolidatedRelief,
        payroll_deductions: result.payrollDeductions,
        chargeable_income: result.chargeableIncome,
        annual_tax_payable: result.annualTax,
        monthly_tax_payable: result.monthlyTax,
        net_monthly_pay: result.netMonthlyPay,
      };

      answer = [
        `Your estimated monthly PAYE is ${formatNaira(result.monthlyTax)}.`,
        `Estimated annual PAYE: ${formatNaira(result.annualTax)}.`,
        `Gross annual income: ${formatNaira(result.annualGross)}.`,
        `Estimated annual relief: ${formatNaira(result.consolidatedRelief)}.`,
        `Payroll deductions used: ${formatNaira(result.payrollDeductions)}.`,
        `Estimated chargeable income: ${formatNaira(result.chargeableIncome)}.`,
        `Estimated monthly net after PAYE/deductions: ${formatNaira(result.netMonthlyPay)}.`,
        'Note: This is an estimate for guidance only. Confirm taxpayer-specific facts, current law, exemptions, and filing position before submission.',
      ].join('\n');
    }
    else if (type === 'vat') {
      const supplies = toNumber(inputs.taxable_supplies);
      const inputVat = toNumber(inputs.input_vat);
      const outputVat = supplies * 0.075;
      const vatDue = Math.max(0, outputVat - inputVat);
      breakdown = {
        taxable_supplies: supplies,
        output_vat: outputVat,
        input_vat: inputVat,
        vat_payable: vatDue,
      };
      answer = `VAT payable is ${formatNaira(vatDue)}.`;
    }
    else if (type === 'cit') {
      const profit = toNumber(inputs.gross_profit);
      const expenses = toNumber(inputs.allowable_expenses);
      const taxableProfit = Math.max(0, profit - expenses);
      const citDue = taxableProfit * 0.2;
      breakdown = {
        gross_profit: profit,
        allowable_expenses: expenses,
        taxable_profit: taxableProfit,
        cit_payable: citDue,
      };
      answer = `Company Income Tax (CIT) payable is ${formatNaira(citDue)}.`;
    }
    else {
      return NextResponse.json({ ok: false, error: 'Invalid tax type' }, { status: 400 });
    }

    console.log('[API] Calculation result:', { ok: true, answer, breakdown });
    return NextResponse.json({ ok: true, answer, breakdown });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
