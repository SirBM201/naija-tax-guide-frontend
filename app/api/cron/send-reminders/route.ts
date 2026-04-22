import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Email sending function (using Resend – free tier)
// Sign up at resend.com, get API key, add to environment variables
async function sendEmail(to: string, subject: string, html: string) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error('RESEND_API_KEY not set');
    return false;
  }
  
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Naija Tax Guide <reminders@naijataxguides.com>',
      to,
      subject,
      html,
    }),
  });
  
  return response.ok;
}

export async function GET() {
  // Verify cron secret to prevent public access
  const authHeader = process.env.CRON_SECRET;
  // You can add a simple token check if needed
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase env missing');
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get all enabled deadlines that have not had a reminder sent yet
    // and whose due date is within reminder_days_before days
    const { data: deadlines, error } = await supabase
      .from('tax_deadlines')
      .select('*, users:user_id(email, display_name)')
      .eq('enabled', true)
      .is('last_reminder_sent_at', null)
      .lte('due_date', new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    
    if (error) throw error;
    
    const sentCount = 0;
    for (const deadline of deadlines || []) {
      const dueDate = new Date(deadline.due_date);
      const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Only send if days remaining <= reminder_days_before
      if (daysRemaining <= deadline.reminder_days_before && daysRemaining >= 0) {
        const userEmail = deadline.users?.email;
        const userName = deadline.users?.display_name || 'User';
        
        if (userEmail) {
          const subject = `Tax Deadline Reminder: ${deadline.tax_type.toUpperCase()}`;
          const html = `
            <h2>Tax Deadline Reminder</h2>
            <p>Hello ${userName},</p>
            <p>Your <strong>${deadline.tax_type.toUpperCase()}</strong> tax filing deadline is approaching.</p>
            <p><strong>Due date:</strong> ${new Date(deadline.due_date).toLocaleDateString()}</p>
            <p><strong>Days remaining:</strong> ${daysRemaining}</p>
            <p>Log in to Naija Tax Guide to prepare and file your taxes.</p>
            <a href="https://www.naijataxguides.com/deadlines">Manage your deadlines →</a>
          `;
          await sendEmail(userEmail, subject, html);
          
          // Update last_reminder_sent_at
          await supabase
            .from('tax_deadlines')
            .update({ last_reminder_sent_at: new Date().toISOString() })
            .eq('id', deadline.id);
        }
      }
    }
    
    return NextResponse.json({ ok: true, sentCount });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
