import { NextRequest, NextResponse } from 'next/server';

function getPreviousLabel(currentLabel: string) {
  // Assumes label format is S<number>
  const match = currentLabel.match(/^S(\d+)$/i);
  if (!match) return null;
  const prevNum = parseInt(match[1], 10) - 1;
  return `S${prevNum}`;
}

export async function POST(req: NextRequest) {
  const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
  const JIRA_EMAIL = process.env.JIRA_EMAIL;
  const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
  const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;

  if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN || !JIRA_PROJECT_KEY) {
    return NextResponse.json({ error: 'Missing Jira environment variables' }, { status: 500 });
  }

  const { currentLabel, component } = await req.json();
  if (!currentLabel || !component) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const previousLabel = getPreviousLabel(currentLabel);
  if (!previousLabel) {
    return NextResponse.json({ error: 'Invalid label format' }, { status: 400 });
  }

  // JQL for previous release bugs
  const jql = `project = ${JIRA_PROJECT_KEY} AND labels = "${previousLabel}" AND component = "${component}" AND issuetype = Bug`;

  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  try {
    const res = await fetch(`${JIRA_BASE_URL}/rest/api/3/search?jql=${encodeURIComponent(jql)}&fields=key,summary,status,priority,labels`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });
    if (!res.ok) {
      throw new Error('Failed to fetch previous bugs from Jira');
    }
    const data = await res.json();
    const prioritized = [];
    const redevelopment = [];
    const devReleased = [];
    for (const issue of data.issues || []) {
      const labels = issue.fields.labels || [];
      const status = issue.fields.status.name;
      if (issue.fields.priority && issue.fields.priority.name.toLowerCase().includes('high')) {
        prioritized.push(issue);
      }
      if (labels.some((l: string) => l.toLowerCase().includes('redevelopment'))) {
        redevelopment.push(issue);
      }
      if (status.toLowerCase() === 'dev released') {
        devReleased.push(issue);
      }
    }
    // Format for frontend
    const format = (arr: any[]) => arr.map(issue => ({
      key: issue.key,
      summary: issue.fields.summary,
      url: `https://applova.atlassian.net/browse/${issue.key}`,
      status: issue.fields.status.name,
      priority: issue.fields.priority?.name || '',
      labels: issue.fields.labels || []
    }));
    return NextResponse.json({
      previousLabel,
      prioritized: format(prioritized),
      redevelopment: format(redevelopment),
      devReleased: format(devReleased)
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 