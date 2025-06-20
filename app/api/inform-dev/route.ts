import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const JIRA_BASE_URL = process.env.JIRA_BASE_URL || 'https://your-domain.atlassian.net';

export async function POST(req: NextRequest) {
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return NextResponse.json({ error: 'Missing SMTP environment variables' }, { status: 500 });
  }
  
  const { tickets, releaseVersion } = await req.json();
  
  if (!tickets || !Array.isArray(tickets)) {
    return NextResponse.json({ error: 'Missing or invalid tickets array' }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465, // true for 465, false for other ports
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  const results = [];
  
  for (const ticket of tickets) {
    if (!ticket.assignee || ticket.assignee === 'Unassigned' || !ticket.key) {
      results.push({ 
        ticket: ticket.key, 
        status: 'skipped', 
        reason: ticket.assignee === 'Unassigned' ? 'No assignee' : 'Missing assignee info' 
      });
      continue;
    }

    const ticketUrl = `${JIRA_BASE_URL}/browse/${ticket.key}`;
    
    const mailOptions = {
      from: SMTP_USER,
      to: ticket.assignee, // This should be the email address
      subject: `Urgent: Jira Ticket ${ticket.key} Missing Release Version for ${releaseVersion}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d32f2f;">⚠️ Action Required: Missing Release Version</h2>
          
          <p>Hi ${ticket.assignee},</p>
          
          <p>We've identified that your Jira ticket <strong>${ticket.key}</strong> is missing a release version assignment.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Ticket Details:</h3>
            <ul style="margin: 10px 0;">
              <li><strong>Ticket:</strong> ${ticket.key}</li>
              <li><strong>Summary:</strong> ${ticket.summary}</li>
              <li><strong>Status:</strong> ${ticket.status}</li>
              <li><strong>Current Release Version:</strong> ${ticket.releaseVersion || 'Not set'}</li>
            </ul>
          </div>
          
          <p><strong>Please update the release version field to: ${releaseVersion}</strong></p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${ticketUrl}" 
               style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Ticket in Jira
            </a>
          </div>
          
          <p>This is required for the test closure process. Please update the ticket as soon as possible.</p>
          
          <p>Thanks,<br>QA Team</p>
        </div>
      `,
      text: `
Hi ${ticket.assignee},

We've identified that your Jira ticket ${ticket.key} is missing a release version assignment.

Ticket Details:
- Ticket: ${ticket.key}
- Summary: ${ticket.summary}
- Status: ${ticket.status}
- Current Release Version: ${ticket.releaseVersion || 'Not set'}

Please update the release version field to: ${releaseVersion}

View ticket: ${ticketUrl}

This is required for the test closure process. Please update the ticket as soon as possible.

Thanks,
QA Team
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      results.push({ ticket: ticket.key, status: 'sent', assignee: ticket.assignee });
    } catch (e: any) {
      results.push({ 
        ticket: ticket.key, 
        status: 'error', 
        error: e.message,
        assignee: ticket.assignee 
      });
    }
  }

  const summary = {
    total: tickets.length,
    sent: results.filter(r => r.status === 'sent').length,
    skipped: results.filter(r => r.status === 'skipped').length,
    errors: results.filter(r => r.status === 'error').length
  };

  return NextResponse.json({ 
    results,
    summary,
    message: `Notifications sent: ${summary.sent}/${summary.total}`
  });
} 