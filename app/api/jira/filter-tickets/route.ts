import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
  const JIRA_EMAIL = process.env.JIRA_EMAIL;
  const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
  const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;

  if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN || !JIRA_PROJECT_KEY) {
    return NextResponse.json({ error: 'Missing Jira environment variables' }, { status: 500 });
  }

  const { label, component } = await req.json();
  if (!label || !component) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // JQL for filtering
  // Note: 'Release Version' is assumed to be the field name. If it's a custom field, the field ID may be needed.
  const jql = `project = ${JIRA_PROJECT_KEY} AND status = "Dev Released" AND labels = "${label}" AND component = "${component}" AND ("Release Version" is EMPTY OR "Release Version" = "")`;

  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  try {
    const res = await fetch(`${JIRA_BASE_URL}/rest/api/3/search?jql=${encodeURIComponent(jql)}&fields=key,summary,assignee,labels,components,status,customfield_10000`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });
    if (!res.ok) {
      throw new Error('Failed to fetch tickets from Jira');
    }
    const data = await res.json();
    return NextResponse.json({ issues: data.issues || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 