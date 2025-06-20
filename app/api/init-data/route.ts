import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY; // Add this to your .env

export async function GET(req: NextRequest) {
  if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN || !JIRA_PROJECT_KEY) {
    return NextResponse.json({ error: 'Missing Jira environment variables' }, { status: 500 });
  }

  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  try {
    // Get labels (Jira Cloud does not have a direct labels endpoint, so this is a workaround)
    // We'll fetch a sample issue and extract labels from it, or you can customize as needed.
    const issuesRes = await axios.get(`${JIRA_BASE_URL}/rest/api/3/search?jql=project=${JIRA_PROJECT_KEY}&maxResults=50&fields=labels`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    const labelsSet = new Set<string>();
    issuesRes.data.issues.forEach((issue: any) => {
      (issue.fields.labels || []).forEach((label: string) => labelsSet.add(label));
    });
    const labels = Array.from(labelsSet);

    // Get components
    const componentsRes = await axios.get(`${JIRA_BASE_URL}/rest/api/3/project/${JIRA_PROJECT_KEY}/components`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    const components = componentsRes.data;

    return NextResponse.json({ labels, components });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 