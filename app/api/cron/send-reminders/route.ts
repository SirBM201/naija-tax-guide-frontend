import { NextRequest, NextResponse } from 'next/server';

// No top‑level imports of Supabase or Mailtrap – they are dynamically imported inside the handler.

export async function GET(req: NextRequest) {
  console.log('[Cron] send-reminders job started');

  // Optional security: check a secret query parameter if you set a secret in cron-job.org
  // const secret = req.nextUrl.searchParams.get('secret');
  // if (secret !== process.env.CRON_SECRET) {
  //   return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    // Dynamically import Supabase and Mailtrap
    const { createClient } = await import('@supabase/supabase-js');
    const { MailtrapClient } = await import('mailtrap');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const mailtrapToken = process.env.MAILTRAP_API_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    if (!mailtrapToken) {
      console.warn('[Cron] MAILTRAP_API_KEY not set – email sending will be skipped');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date (UTC, start of day)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Query deadlines that:
    // - are enabled
    // - have not had a reminder sent (or you can also re‑send after some period)
    // - due date is within the reminder window (due_date >= today AND due_date <= today + reminder_days_before)
    // We'll also join the users table to get email and display name.
    // Note: The users table may be named `profiles` or `users` – adjust accordingly.
    const { data: deadlines, error } = await supabase
      .from('tax_deadlines')
      .select(`
        id,
        tax_type,
        due_date,
        reminder_days_before,
        user_id,
        last_reminder_sent_at,
        users:user_id (email, display_name)
      `)
      .eq('enabled', true)
      .is('last_reminder_sent_at', null)       // send only once per deadline
      .gte('due_date', today.toISOString().split('T')[0]);

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

    // Helper function to send email using Mailtrap
    const sendEmailWithMailtrap = async (to: string, subject: string, html: string) => {
      if (!mailtrapToken) {
        console.log(`[Cron] Skipping email to ${to} – no MAILTRAP_API_KEY`);
        return false;
      }
      try {
        const client = new MailtrapClient({ token: mailtrapToken });
        const sender = { email: 'reminders@naijataxguides.com', name: 'Naija Tax Guide' };
        const recipients = [{ email: to }];
        await client.send({
          from: sender,
          to: recipients,
          subject,
          html,
          category: 'tax-deadline-reminder',
        });
        return true;
      } catch (err) {
        console.error(`[Cron] Failed to send email to ${to}:`, err);
        return false;
      }
    };

    for (const deadline of deadlines) {
      const user = deadline.users as any; // adjust type as needed
      const userEmail = user?.email;
      const userName = user?.display_name || 'Valued User';

      if (!userEmail) {
        console.warn(`[Cron] No email for user ${deadline.user_id}, skipping`);
        continue;
      }

      const dueDate = new Date(deadline.due_date);
      const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Only send if within reminder window
      if (daysRemaining < 0 || daysRemaining > deadline.reminder_days_before) {
        console.log(`[Cron] Deadline ${deadline.id} (${deadline.tax_type}) is not within reminder window (days remaining: ${daysRemaining})`);
        continue;
      }

      const subject = `Tax Deadline Reminder: ${deadline.tax_type.toUpperCase()}`;
      const formattedDueDate = dueDate.toLocaleDateString('en-GB');
      const html = `
        <h2>Tax Deadline Reminder</h2>
        <p>Hello ${userName},</p>
        <p>Your <strong>${deadline.tax_type.toUpperCase()}</strong> tax filing deadline is approaching.</p>
        <p><strong>Due date:</strong> ${formattedDueDate}</p>
        <p><strong>Days remaining:</strong> ${daysRemaining}</p>
        <p>Log in to Naija Tax Guide to prepare and file your taxes.</p>
        <a href="https://www.naijataxguides.com/deadlines">Manage your deadlines →</a>
        <hr />
        <small>You received this email because you enabled reminders for this deadline in your Naija Tax Guide account.</small>
      `;

      const emailSent = await sendEmailWithMailtrap(userEmail, subject, html);
      if (emailSent) {
        sentCount++;
        // Update last_reminder_sent_at to avoid sending again
        await supabase
          .from('tax_deadlines')
          .update({ last_reminder_sent_at: new Date().toISOString() })
          .eq('id', deadline.id);
      } else {
        errors.push(`Failed to send to ${userEmail} for deadline ${deadline.id}`);
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
