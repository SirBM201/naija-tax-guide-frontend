// app/api/cron/send-reminders/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  console.log('[Cron] send-reminders job started');
  
  // 1. Validate authorization (recommended) 
  // const authHeader = req.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    // Dynamically import the Resend SDK
    const { Resend } = await import('resend');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    if (!resendApiKey) {
      console.warn('[Cron] RESEND_API_KEY not set – email sending will be skipped');
      return NextResponse.json({ ok: false, error: 'Missing RESEND_API_KEY' }, { status: 500 });
    }

    // Dynamically import Supabase
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);
    
    // Get today's date (UTC, start of day)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // 2. Fetch pending deadlines from Supabase
    const { data: deadlines, error } = await supabase
      .from('tax_deadlines')
      .select(`
        id,
        tax_type,
        due_date,
        reminder_days_before,
        user_id,
        last_reminder_sent_at
      `)
      .eq('enabled', true)
      .is('last_reminder_sent_at', null)  // send reminder only once
      .gte('due_date', todayStr);          // due today or in the future

    if (error) {
      console.error('[Cron] Supabase query error:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    if (!deadlines || deadlines.length === 0) {
      console.log('[Cron] No deadlines to process');
      return NextResponse.json({ ok: true, message: 'No deadlines to process' });
    }

    let sentCount = 0;
    const errors: string[] = [];

    // Helper function to send email using Resend
    // Ensure that the 'from' email is a verified domain in Resend
    const sendEmailWithResend = async (to: string, subject: string, html: string) => {
      try {
        await resend.emails.send({
          from: 'Naija Tax Guide <reminders@naijataxguides.com>',
          to: [to],
          subject: subject,
          html: html,
        });
        return true;
      } catch (err) {
        console.error(`[Cron] Failed to send email to ${to}:`, err);
        return false;
      }
    };

    // Fetch user emails from your Supabase user table
    // Adjust the table name and column names based on your schema
    for (const deadline of deadlines) {
      const { data: user, error: userError } = await supabase
        .from('users')  // Replace with your actual user table name
        .select('email, display_name')
        .eq('id', deadline.user_id)
        .single();

      if (userError || !user?.email) {
        console.warn(`[Cron] No email for user ${deadline.user_id}, skipping`);
        errors.push(`No email found for user ${deadline.user_id}`);
        continue;
      }

      const dueDate = new Date(deadline.due_date);
      const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysRemaining < 0 || daysRemaining > deadline.reminder_days_before) {
        console.log(`[Cron] Deadline ${deadline.id} (${deadline.tax_type}) is not within reminder window (days remaining: ${daysRemaining})`);
        continue;
      }

      const subject = `Tax Deadline Reminder: ${deadline.tax_type.toUpperCase()}`;
      const formattedDueDate = dueDate.toLocaleDateString('en-GB');
      const html = `
        <h2>Tax Deadline Reminder</h2>
        <p>Hello ${user.display_name || 'Valued User'},</p>
        <p>Your <strong>${deadline.tax_type.toUpperCase()}</strong> tax filing deadline is approaching.</p>
        <p><strong>Due date:</strong> ${formattedDueDate}</p>
        <p><strong>Days remaining:</strong> ${daysRemaining}</p>
        <p>Log in to Naija Tax Guide to prepare and file your taxes.</p>
        <a href="https://www.naijataxguides.com/deadlines">Manage your deadlines →</a>
        <hr />
        <small>You received this email because you enabled reminders for this deadline in your Naija Tax Guide account.</small>
      `;

      const emailSent = await sendEmailWithResend(user.email, subject, html);
      if (emailSent) {
        sentCount++;
        // Update last_reminder_sent_at
        await supabase
          .from('tax_deadlines')
          .update({ last_reminder_sent_at: new Date().toISOString() })
          .eq('id', deadline.id);
      } else {
        errors.push(`Failed to send to ${user.email} for deadline ${deadline.id}`);
      }
    }

    console.log(`[Cron] Sent ${sentCount} reminders, errors: ${errors.length}`);
    if (errors.length > 0) {
      return NextResponse.json({ ok: true, sentCount, errors }, { status: 207 });
    }
    return NextResponse.json({ ok: true, sentCount });

  } catch (error) {
    console.error('[Cron] Unhandled error:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
