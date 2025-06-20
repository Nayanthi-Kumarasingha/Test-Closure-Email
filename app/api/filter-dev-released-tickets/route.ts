import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;

export async function POST(req: NextRequest) {
  if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN || !JIRA_PROJECT_KEY) {
    return NextResponse.json({ error: 'Missing Jira environment variables' }, { status: 500 });
  }
  const { releaseVersion, label, component } = await req.json();
  if (!label || !component) {
    return NextResponse.json({ error: 'Missing label or component' }, { status: 400 });
  }
  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  const jql = [
    `project = ${JIRA_PROJECT_KEY}`,
    `labels = "${label}"`,
    `component = "${component}"`,
    `status = "Dev Released"`,
    'fixVersion is EMPTY'
  ].join(' AND ');
  try {
    const res = await axios.get(`${JIRA_BASE_URL}/rest/api/3/search`, {
      params: {
        jql,
        fields: 'summary,assignee',
        maxResults: 100
      },
      headers: { Authorization: `Basic ${auth}` }
    });
    const tickets = res.data.issues.map((issue: any) => ({
      key: issue.key,
      summary: issue.fields.summary,
      assignee: issue.fields.assignee?.emailAddress || null,
      assigneeName: issue.fields.assignee?.displayName || null,
      url: `${JIRA_BASE_URL}/browse/${issue.key}`
    }));
    return NextResponse.json({ tickets });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 