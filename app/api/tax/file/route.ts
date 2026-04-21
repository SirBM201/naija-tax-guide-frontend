import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lazy initialization of Supabase client (only at runtime, not build time)
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables are not set');
    }
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabase;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taxType, inputs, documents, userId } = body;

    if (!taxType || !inputs) {
      return NextResponse.json(
        { ok: false, error: 'Missing tax type or filing data' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const reference = `NTG-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const supabaseClient = getSupabase();

    const { data, error } = await supabaseClient
      .from('tax_filings')
      .insert({
        user_id: userId,
        tax_type: taxType,
        inputs,
        documents: documents || [],
        reference,
        status: 'submitted',
      })
      .select()
      .single();

    if (error) {
      console.error('[Filing] Supabase error:', error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Your tax filing has been submitted successfully.',
      reference: data.reference,
      submittedAt: data.submitted_at,
    });
  } catch (error) {
    console.error('[Filing] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Server error during filing' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ ok: false, error: 'User ID required' }, { status: 400 });
  }

  try {
    const supabaseClient = getSupabase();

    const { data, error } = await supabaseClient
      .from('tax_filings')
      .select('*')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('[Filing] Supabase error:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const filings = data.map(f => ({
      id: f.reference,
      taxType: f.tax_type,
      inputs: f.inputs,
      documents: f.documents,
      userId: f.user_id,
      status: f.status,
      submittedAt: f.submitted_at,
    }));

    return NextResponse.json({ ok: true, filings });
  } catch (error) {
    console.error('[Filing] Error:', error);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
