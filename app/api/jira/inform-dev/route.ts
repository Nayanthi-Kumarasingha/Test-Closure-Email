import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
  const JIRA_EMAIL = process.env.JIRA_EMAIL;
  const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = process.env.SMTP_PORT;
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;

  if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN || !SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
  }

  const { issues } = await req.json();
  if (!issues || !Array.isArray(issues) || issues.length === 0) {
    return NextResponse.json({ error: 'Missing or invalid issues array' }, { status: 400 });
  }

  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  const results = [];

  for (const issueKey of issues) {
    try {
      // Fetch issue details from Jira
      const res = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}?fields=assignee,summary`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      });
      if (!res.ok) throw new Error(`Failed to fetch issue ${issueKey}`);
      const data = await res.json();
      const assignee = data.fields.assignee;
      if (!assignee || !assignee.emailAddress) throw new Error(`No assignee email for issue ${issueKey}`);
      const devEmail = assignee.emailAddress;
      const devName = assignee.displayName || 'Developer';
      const summary = data.fields.summary;
      const mailOptions = {
        from: SMTP_USER,
        to: devEmail,
        subject: `Urgent: Jira Ticket ${issueKey} Missing Release Version`,
        text: `Hi ${devName},\n\nIt looks like this Jira ticket hasn't been linked to a release version. Please update it as soon as possible:\n\nhttps://applova.atlassian.net/browse/${issueKey}\n\nTicket: ${summary}\n\nThanks,\n\nQA Team`
      };
      await transporter.sendMail(mailOptions);
      results.push({ issueKey, status: 'sent', to: devEmail });
    } catch (e: any) {
      results.push({ issueKey, status: 'error', error: e.message });
    }
  }

  return NextResponse.json({ results });
} 