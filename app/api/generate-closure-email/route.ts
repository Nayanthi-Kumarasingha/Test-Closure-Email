import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { releaseStatus, releaseVersion, devEmails, limitations, foundBugs } = await req.json();
  // Placeholder for AI-generated "Tested Area"
  const testedArea = 'Tested Area: [AI-generated summary based on filtered tickets]';
  // Build bugs table HTML
  const bugsTable = foundBugs && foundBugs.length > 0
    ? `<table border="1" cellpadding="5" cellspacing="0"><tr><th>Title</th><th>Status</th><th>Severity</th><th>Legacy</th><th>Priority</th></tr>${foundBugs.map((bug: any) => `<tr><td>${bug.title}</td><td>${bug.status}</td><td>${bug.severity}</td><td>${bug.legacy}</td><td>${bug.priority}</td></tr>`).join('')}</table>`
    : '<p>No bugs found.</p>';
  const html = `
    <h2>Release Status: ${releaseStatus}</h2>
    <h3>Release Version: ${releaseVersion}</h3>
    <p><b>Developers:</b> ${devEmails?.join(', ')}</p>
    <p><b>Limitations:</b> ${limitations}</p>
    <p>${testedArea}</p>
    <h3>Found Bugs</h3>
    ${bugsTable}
    <p>Thanks,<br/>QA Team</p>
  `;
  return NextResponse.json({ html });
} 