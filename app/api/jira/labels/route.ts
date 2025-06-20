import { NextResponse } from 'next/server';

export async function GET() {
  const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
  const JIRA_EMAIL = process.env.JIRA_EMAIL;
  const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

  if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
    return NextResponse.json({ error: 'Missing Jira environment variables' }, { status: 500 });
  }

  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  try {
    const res = await fetch(`${JIRA_BASE_URL}/rest/api/3/label`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });
    if (!res.ok) {
      throw new Error('Failed to fetch labels from Jira');
    }
    const data = await res.json();
    
    // Get all labels
    const allLabels = data.values || data.labels || [];
    
    // Filter labels that end with "-release"
    const releaseLabels = allLabels.filter((label: string) => 
      label.toLowerCase().endsWith('-release')
    );
    
    // Sort release labels (e.g., s137-release, s138-release, s139-release)
    const sortedReleaseLabels = releaseLabels.sort((a: string, b: string) => {
      // Extract numbers from labels like "s137-release" and "s138-release"
      const aMatch = a.match(/s(\d+)-release/i);
      const bMatch = b.match(/s(\d+)-release/i);
      
      if (aMatch && bMatch) {
        return parseInt(bMatch[1]) - parseInt(aMatch[1]); // Sort in descending order (newest first)
      }
      
      return a.localeCompare(b); // Fallback to alphabetical sort
    });
    
    return NextResponse.json({ labels: sortedReleaseLabels });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 