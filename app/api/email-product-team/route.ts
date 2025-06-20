import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

const TO = 'pasindu@applova.io';
const CC = ['kushanij@getapplova.com', 'kalinga.d@getapplova.com'];

export async function POST(req: NextRequest) {
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return NextResponse.json({ error: 'Missing SMTP environment variables' }, { status: 500 });
  }
  const { bugs } = await req.json();
  if (!bugs || !Array.isArray(bugs) || bugs.length === 0) {
    return NextResponse.json({ error: 'Missing or invalid bugs array' }, { status: 400 });
  }
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
  const bugList = bugs.map((bug: any) => `    ${bug.url} - ${bug.summary}`).join('\n');
  const mailOptions = {
    from: SMTP_USER,
    to: TO,
    cc: CC,
    subject: 'Action Required: Unresolved Bugs',
    text: `Hi Product Team,\n\nJust a quick heads-up that a few critical bugs are still unresolved.\nHere are the Jira tickets:\n\n${bugList}\n\nCould you please provide an update on these?\n\nThanks,\n\nQA Team`
  };
  try {
    await transporter.sendMail(mailOptions);
    return NextResponse.json({ status: 'sent' });
  } catch (e: any) {
    return NextResponse.json({ status: 'error', error: e.message });
  }
} 