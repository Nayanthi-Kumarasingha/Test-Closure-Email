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

  // JQL for all tickets with the given label and component
  const jql = `project = ${JIRA_PROJECT_KEY} AND labels = "${label}" AND component = "${component}"`;

  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  try {
    const res = await fetch(`${JIRA_BASE_URL}/rest/api/3/search?jql=${encodeURIComponent(jql)}&fields=summary,components`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });
    if (!res.ok) {
      throw new Error('Failed to fetch tickets from Jira');
    }
    const data = await res.json();
    // Collect unique components and keywords from summaries
    const componentsSet = new Set();
    const keywordsSet = new Set();
    for (const issue of data.issues || []) {
      (issue.fields.components || []).forEach((c: any) => componentsSet.add(c.name));
      // Extract keywords from summary (simple split by space, filter common words)
      const words = (issue.fields.summary || '').split(/\s+/).map((w: string) => w.toLowerCase());
      words.forEach((word: string) => {
        if (word.length > 3 && !['with', 'from', 'this', 'that', 'have', 'for', 'the', 'and', 'but', 'are', 'has', 'was', 'all', 'can', 'not', 'any', 'you', 'your', 'our', 'their', 'will', 'should', 'able', 'when', 'then', 'than', 'each', 'more', 'less', 'also', 'just', 'like', 'into', 'over', 'under', 'after', 'before', 'been', 'only', 'some', 'such', 'very', 'much', 'many', 'most', 'other', 'which', 'where', 'what', 'who', 'how', 'why', 'could', 'would', 'about', 'above', 'below', 'between', 'during', 'through', 'because', 'while', 'these', 'those', 'every', 'both', 'either', 'neither', 'since', 'until', 'within', 'without', 'across', 'against', 'among', 'around', 'behind', 'beside', 'despite', 'except', 'inside', 'outside', 'toward', 'upon', 'via'].includes(word)) {
          keywordsSet.add(word);
        }
      });
    }
    const components = Array.from(componentsSet).join(', ');
    const keywords = Array.from(keywordsSet).slice(0, 10).join(', ');
    const testedArea = `Tested components: ${components}. Key areas: ${keywords}`;
    return NextResponse.json({ testedArea });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 