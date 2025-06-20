import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
  const JIRA_EMAIL = process.env.JIRA_EMAIL;
  const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
  const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;

  if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN || !JIRA_PROJECT_KEY) {
    return NextResponse.json({ error: 'Missing Jira environment variables' }, { status: 500 });
  }

  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  
  try {
    // Get some sample tickets to see what data exists
    const sampleJql = `project = ${JIRA_PROJECT_KEY} ORDER BY created DESC`;
    const res = await fetch(`${JIRA_BASE_URL}/rest/api/3/search?jql=${encodeURIComponent(sampleJql)}&fields=key,summary,status,labels,components&maxResults=10`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ error: `Debug failed: ${res.status} ${errorText}` }, { status: 500 });
    }
    
    const data = await res.json();
    
    // Extract unique statuses, labels, and components from sample tickets
    const statuses = new Set<string>();
    const labels = new Set<string>();
    const components = new Set<string>();
    
    data.issues?.forEach((issue: any) => {
      statuses.add(issue.fields.status.name);
      issue.fields.labels?.forEach((label: string) => labels.add(label));
      issue.fields.components?.forEach((comp: any) => components.add(comp.name));
    });
    
    return NextResponse.json({ 
      success: true,
      totalIssues: data.total,
      sampleIssues: data.issues?.length || 0,
      statuses: Array.from(statuses).sort(),
      labels: Array.from(labels).sort(),
      components: Array.from(components).sort(),
      sampleTickets: data.issues?.map((issue: any) => ({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        labels: issue.fields.labels || [],
        components: issue.fields.components?.map((c: any) => c.name) || []
      })) || []
    });

  } catch (e: any) {
    console.error('Debug error:', e);
    return NextResponse.json({ 
      error: e.message,
      stack: e.stack
    }, { status: 500 });
  }
} 