import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for filings (replace with database later)
const filings: any[] = [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taxType, inputs, documents, userId } = body;

    // Validate required fields
    if (!taxType || !inputs) {
      return NextResponse.json(
        { ok: false, error: 'Missing tax type or filing data' },
        { status: 400 }
      );
    }

    // Generate a filing reference
    const reference = `NTG-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    // Create filing record
    const filingRecord = {
      id: reference,
      taxType,
      inputs,
      documents: documents || [],
      userId: userId || 'anonymous',
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    };
    
    filings.push(filingRecord);
    console.log('[Filing] New filing saved:', filingRecord);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return NextResponse.json({
      ok: true,
      message: 'Your tax filing has been submitted successfully.',
      reference,
      submittedAt: filingRecord.submittedAt,
    });
  } catch (error) {
    console.error('[Filing] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Server error during filing' },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to retrieve filing history (for later)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (userId) {
    const userFilings = filings.filter(f => f.userId === userId);
    return NextResponse.json({ ok: true, filings: userFilings });
  }
  return NextResponse.json({ ok: true, filings });
}
