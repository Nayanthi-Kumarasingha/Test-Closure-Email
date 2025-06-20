import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;

const STATUS_CATEGORIES = [
  'Open',
  'In Progress',
  'In Development',
  'In QA',
  'QA Completed',
  'Reported Bugs'
];

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
    'fixVersion is EMPTY'
  ].join(' AND ');
  try {
    const res = await axios.get(`${JIRA_BASE_URL}/rest/api/3/search`, {
      params: {
        jql,
        fields: 'status',
        maxResults: 100
      },
      headers: { Authorization: `Basic ${auth}` }
    });
    const counts: Record<string, number> = {};
    STATUS_CATEGORIES.forEach(status => (counts[status] = 0));
    res.data.issues.forEach((issue: any) => {
      const status = issue.fields.status?.name;
      if (status && counts.hasOwnProperty(status)) {
        counts[status]++;
      }
    });
    return NextResponse.json({ counts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 