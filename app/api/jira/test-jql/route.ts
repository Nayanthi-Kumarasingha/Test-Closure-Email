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

  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  
  try {
    // Convert label to the correct format (e.g., "S138" -> "s138-release")
    const formattedLabel = label.toLowerCase() + '-release';
    
    // Test the exact JQL query from filter-tickets
    const jql = `project = ${JIRA_PROJECT_KEY} AND status = "Open" AND labels = "${formattedLabel}" AND component = "${component}"`;
    
    console.log('Testing JQL:', jql);
    
    const res = await fetch(`${JIRA_BASE_URL}/rest/api/3/search?jql=${encodeURIComponent(jql)}&fields=key,summary,assignee,labels,components,status,fixVersions&maxResults=100`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('JQL test error:', res.status, errorText);
      return NextResponse.json({ 
        error: `JQL test failed: ${res.status} ${errorText}`,
        jql: jql,
        status: res.status
      }, { status: 500 });
    }
    
    const data = await res.json();
    
    return NextResponse.json({ 
      success: true,
      jql: jql,
      formattedLabel: formattedLabel,
      total: data.total,
      maxResults: data.maxResults,
      startAt: data.startAt,
      issues: data.issues?.length || 0,
      sampleIssue: data.issues?.[0] ? {
        key: data.issues[0].key,
        summary: data.issues[0].fields.summary,
        status: data.issues[0].fields.status.name,
        labels: data.issues[0].fields.labels,
        components: data.issues[0].fields.components?.map((c: any) => c.name),
        fixVersions: data.issues[0].fields.fixVersions?.map((v: any) => v.name)
      } : null
    });

  } catch (e: any) {
    console.error('JQL test error:', e);
    return NextResponse.json({ 
      error: e.message,
      stack: e.stack
    }, { status: 500 });
  }
} 