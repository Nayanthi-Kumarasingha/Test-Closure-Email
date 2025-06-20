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

  // JQL for all tickets with the given label and component
  const jql = `project = ${JIRA_PROJECT_KEY} AND labels = "${label}" AND component = "${component}"`;

  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  try {
    const res = await fetch(`${JIRA_BASE_URL}/rest/api/3/search?jql=${encodeURIComponent(jql)}&fields=key,status,issuetype`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });
    if (!res.ok) {
      throw new Error('Failed to fetch tickets from Jira');
    }
    const data = await res.json();
    const summary = {
      open: 0,
      inProgress: 0,
      inDevelopment: 0,
      inQA: 0,
      qaCompleted: 0,
      reportedBugs: 0
    };
    for (const issue of data.issues || []) {
      const status = issue.fields.status.name.toLowerCase();
      if (status.includes('open')) summary.open++;
      else if (status.includes('progress')) summary.inProgress++;
      else if (status.includes('development')) summary.inDevelopment++;
      else if (status.includes('qa completed')) summary.qaCompleted++;
      else if (status.includes('qa')) summary.inQA++;
      if (issue.fields.issuetype.name.toLowerCase().includes('bug')) summary.reportedBugs++;
    }
    return NextResponse.json({ summary, total: data.issues.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 