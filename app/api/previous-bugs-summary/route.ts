import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;

function getPreviousLabel(label: string): string {
  // Assumes label format is S<number>
  const match = label.match(/^S(\d+)$/);
  if (match) {
    const prev = parseInt(match[1], 10) - 1;
    return `S${prev}`;
  }
  return label;
}

export async function POST(req: NextRequest) {
  if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN || !JIRA_PROJECT_KEY) {
    return NextResponse.json({ error: 'Missing Jira environment variables' }, { status: 500 });
  }
  const { label, component } = await req.json();
  if (!label || !component) {
    return NextResponse.json({ error: 'Missing label or component' }, { status: 400 });
  }
  const prevLabel = getPreviousLabel(label);
  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  const jql = [
    `project = ${JIRA_PROJECT_KEY}`,
    `labels = "${prevLabel}"`,
    `component = "${component}"`
  ].join(' AND ');
  try {
    const res = await axios.get(`${JIRA_BASE_URL}/rest/api/3/search`, {
      params: {
        jql,
        fields: 'summary,status',
        maxResults: 100
      },
      headers: { Authorization: `Basic ${auth}` }
    });
    const prioritized: any[] = [];
    const redevelopment: any[] = [];
    const devReleased: any[] = [];
    res.data.issues.forEach((issue: any) => {
      const status = issue.fields.status?.name;
      const ticket = {
        key: issue.key,
        title: issue.fields.summary,
        url: `${JIRA_BASE_URL}/browse/${issue.key}`
      };
      if (status === 'Prioritized Bugs') prioritized.push(ticket);
      else if (status === 'Redevelopment Bugs') redevelopment.push(ticket);
      else if (status === 'Dev Released') devReleased.push(ticket);
    });
    return NextResponse.json({
      prioritized,
      redevelopment,
      devReleased
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 