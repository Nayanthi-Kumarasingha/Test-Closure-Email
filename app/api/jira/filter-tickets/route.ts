import { NextRequest, NextResponse } from 'next/server';

interface Ticket {
  key: string;
  summary: string;
  assignee: string;
  status: string;
  labels: string[];
  components: string[];
  fixVersions: string[];
}

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

  // Convert label to the correct format (e.g., "S138" -> "s138-release")
  const formattedLabel = label.toLowerCase() + '-release';
  
  // JQL for filtering tickets with Open status and the specified label and component
  const jql = `project = ${JIRA_PROJECT_KEY} AND status = "Open" AND labels = "${formattedLabel}" AND component = "${component}"`;

  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  try {
    const res = await fetch(`${JIRA_BASE_URL}/rest/api/3/search?jql=${encodeURIComponent(jql)}&fields=key,summary,assignee,labels,components,status,fixVersions&maxResults=100`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Jira API error:', res.status, errorText);
      throw new Error(`Failed to fetch tickets from Jira: ${res.status} ${errorText}`);
    }
    
    const data = await res.json();
    
    // Transform the data to a cleaner format
    const tickets: Ticket[] = data.issues?.map((issue: any) => ({
      key: issue.key,
      summary: issue.fields.summary,
      assignee: issue.fields.assignee?.displayName || 'Unassigned',
      status: issue.fields.status.name,
      labels: issue.fields.labels || [],
      components: issue.fields.components?.map((comp: any) => comp.name) || [],
      fixVersions: issue.fields.fixVersions?.map((version: any) => version.name) || []
    })) || [];
    
    // Filter tickets that have no fix versions assigned
    const ticketsWithoutFixVersion = tickets.filter((ticket: Ticket) => 
      !ticket.fixVersions || ticket.fixVersions.length === 0
    );
    
    return NextResponse.json({ 
      tickets: ticketsWithoutFixVersion,
      totalCount: ticketsWithoutFixVersion.length,
      jql: jql, // for debugging
      allTicketsCount: tickets.length,
      formattedLabel: formattedLabel
    });
  } catch (e: any) {
    console.error('Error fetching tickets:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 