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
  if (!label) {
    return NextResponse.json({ error: 'Missing required label' }, { status: 400 });
  }

  let jql = `project = ${JIRA_PROJECT_KEY} AND issuetype = Bug AND labels = "${label}"`;
  if (component) {
    jql += ` AND component = "${component}"`;
  }

  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  try {
    const res = await fetch(`${JIRA_BASE_URL}/rest/api/3/search?jql=${encodeURIComponent(jql)}&fields=key,summary,status,priority,labels,customfield_10034`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });
    if (!res.ok) {
      throw new Error('Failed to fetch bugs from Jira');
    }
    const data = await res.json();
    const bugs = (data.issues || []).map((issue: any) => {
      const labels = issue.fields.labels || [];
      // Try to get severity from custom field (replace customfield_10034 with your actual Severity field ID)
      let severity = issue.fields.customfield_10034 || '';
      if (!severity) {
        // Try to infer from labels
        const sevLabel = labels.find((l: string) => l.toLowerCase().includes('severity'));
        if (sevLabel) severity = sevLabel;
      }
      const legacy = labels.some((l: string) => l.toLowerCase().includes('legacy'));
      return {
        key: issue.key,
        title: issue.fields.summary,
        status: issue.fields.status.name,
        severity,
        legacy,
        priority: issue.fields.priority?.name || ''
      };
    });
    return NextResponse.json({ bugs });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 