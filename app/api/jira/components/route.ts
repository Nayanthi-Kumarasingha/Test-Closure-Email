import { NextResponse } from 'next/server';

export async function GET() {
  const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
  const JIRA_EMAIL = process.env.JIRA_EMAIL;
  const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
  const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;

  if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN || !JIRA_PROJECT_KEY) {
    return NextResponse.json({ error: 'Missing Jira environment variables' }, { status: 500 });
  }

  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  try {
    const res = await fetch(`${JIRA_BASE_URL}/rest/api/3/project/${JIRA_PROJECT_KEY}/components`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });
    if (!res.ok) {
      throw new Error('Failed to fetch components from Jira');
    }
    const data = await res.json();
    return NextResponse.json({ components: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 