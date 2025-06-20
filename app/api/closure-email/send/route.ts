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
  const { releaseStatus, releaseVersion, devs, limitation, testedArea, foundBugs } = await req.json();
  if (!releaseStatus || !releaseVersion || !devs || !Array.isArray(devs) || devs.length === 0 || !testedArea || !foundBugs) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
  // Format found bugs as a table
  const bugTable = foundBugs.length > 0
    ? foundBugs.map((bug: any, idx: number) => `${idx + 1}. ${bug.title} | Status: ${bug.status} | Severity: ${bug.severity} | Legacy: ${bug.legacy ? 'Yes' : 'No'} | Priority: ${bug.priority}`).join('\n')
    : 'No bugs found.';
  const mailOptions = {
    from: SMTP_USER,
    to: devs,
    subject: `Test Closure: Release ${releaseVersion}`,
    text: `Release Status: ${releaseStatus}\nRelease Version: ${releaseVersion}\n\nTested Area:\n${testedArea}\n\nLimitation:\n${limitation || 'None'}\n\nFound Bugs:\n${bugTable}\n\nThanks,\nQA Team`
  };
  try {
    await transporter.sendMail(mailOptions);
    return NextResponse.json({ status: 'sent' });
  } catch (e: any) {
    return NextResponse.json({ status: 'error', error: e.message });
  }
} 