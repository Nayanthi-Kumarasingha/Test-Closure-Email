import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

export async function POST(req: NextRequest) {
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return NextResponse.json({ error: 'Missing SMTP environment variables' }, { status: 500 });
  }
  const { tickets } = await req.json();
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
    if (!ticket.assignee || !ticket.assigneeName || !ticket.key || !ticket.url) continue;
    const mailOptions = {
      from: SMTP_USER,
      to: ticket.assignee,
      subject: `Urgent: Jira Ticket ${ticket.key} Missing Release Version`,
      text: `Hi ${ticket.assigneeName},\n\nIt looks like this Jira ticket hasn't been linked to a release version. Please update it as soon as possible:\n\n${ticket.url}\n\nThanks,\nQA Team`
    };
    try {
      await transporter.sendMail(mailOptions);
      results.push({ ticket: ticket.key, status: 'sent' });
    } catch (e: any) {
      results.push({ ticket: ticket.key, status: 'error', error: e.message });
    }
  }
  return NextResponse.json({ results });
} 