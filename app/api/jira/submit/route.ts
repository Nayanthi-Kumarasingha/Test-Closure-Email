import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
  const JIRA_EMAIL = process.env.JIRA_EMAIL;
  const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
  const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;

  if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN || !JIRA_PROJECT_KEY) {
    return NextResponse.json({ error: 'Missing Jira environment variables' }, { status: 500 });
  }

  const { releaseVersion, label, component } = await req.json();
  if (!releaseVersion || !label || !component) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  const issueData = {
    fields: {
      project: { key: JIRA_PROJECT_KEY },
      summary: `Release ${releaseVersion} - ${label} - ${component}`,
      description: `Release Version: ${releaseVersion}\nLabel: ${label}\nComponent: ${component}`,
      issuetype: { name: 'Task' },
      labels: [label],
      components: [{ name: component }],
    }
  };
  try {
    const res = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(issueData)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.errorMessages ? error.errorMessages.join(', ') : 'Failed to create Jira issue');
    }
    const data = await res.json();
    return NextResponse.json({ issueKey: data.key });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 