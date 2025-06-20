"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { Reply, Copy, ArrowLeft } from "lucide-react"

interface EmailData {
  releaseStatus: string
  releaseVersion: string
  devEmail: string
  limitations: string
  testedAreas: string
  reasonForStatus?: string
  bugs: Array<{
    title: string
    status: string
    severity: string
    isLegacy: boolean
    priority: string
  }>
}

export default function EmailPreviewPage() {
  const [emailData, setEmailData] = useState<EmailData | null>(null)
  const [emailContent, setEmailContent] = useState("")
  const router = useRouter()

  useEffect(() => {
    const data = sessionStorage.getItem("emailTemplate")
    if (data) {
      const parsed = JSON.parse(data)
      setEmailData(parsed)

      // Generate email content
      const content = generateEmailContent(parsed)
      setEmailContent(content)
    } else {
      router.push("/email-template")
    }
  }, [router])

  const generateEmailContent = (data: EmailData) => {
    let bugsSection = ""

    // Only include bugs table if status is not "Good to go LIVE"
    if (data.releaseStatus !== "Good to go LIVE") {
      // Create a formatted table for bugs
      const bugsTableHeader = `
+--------------------------------------------------+-------------+----------+---------+----------+
| Bug Title                                        | Status      | Severity | Legacy  | Priority |
+--------------------------------------------------+-------------+----------+---------+----------+`

      const bugsTableRows = data.bugs
        .map((bug) => {
          const title = bug.title.padEnd(48).substring(0, 48)
          const status = bug.status.padEnd(11).substring(0, 11)
          const severity = bug.severity.padEnd(8).substring(0, 8)
          const legacy = (bug.isLegacy ? "Yes" : "No").padEnd(7).substring(0, 7)
          const priority = bug.priority.padEnd(8).substring(0, 8)

          return `| ${title} | ${status} | ${severity} | ${legacy} | ${priority} |`
        })
        .join("\n")

      const bugsTableFooter = `+--------------------------------------------------+-------------+----------+---------+----------+`

      bugsSection = `
FOUND BUGS:
${bugsTableHeader}
${bugsTableRows}
${bugsTableFooter}

`
    }

    return `Subject: Release Closure - ${data.releaseVersion}

Dear Team,

I hope this email finds you well. I'm writing to provide you with the closure summary for release ${data.releaseVersion}.

RELEASE STATUS: ${data.releaseStatus}

${
  data.reasonForStatus
    ? `REASON FOR STATUS:
${data.reasonForStatus}

`
    : ""
}TESTED AREAS:
${data.testedAreas}

${
  data.limitations
    ? `LIMITATIONS:
${data.limitations}

`
    : ""
}${bugsSection}${
  data.devEmail
    ? `Development Lead: ${data.devEmail}

`
    : ""
}Please review the above information and let me know if you have any questions or concerns.

Best regards,
QA Team`
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(emailContent)
      alert("Email content copied to clipboard!")
    } catch (err) {
      console.error("Failed to copy: ", err)
    }
  }

  const handleReply = () => {
    // Simulate opening email client
    const subject = encodeURIComponent(`Release Closure - ${emailData?.releaseVersion}`)
    const body = encodeURIComponent(emailContent)
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  if (!emailData) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-800">Email Preview</CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Review and edit your closure email before sending
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Email Content</label>
              <Textarea
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <Button
                onClick={handleReply}
                className="h-12 bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center gap-2"
              >
                <Reply className="h-5 w-5" />
                Reply to Email
              </Button>

              <Button onClick={handleCopy} variant="outline" className="h-12 flex items-center gap-2">
                <Copy className="h-5 w-5" />
                Copy Content
              </Button>

              <Button
                onClick={() => router.push("/email-template")}
                variant="outline"
                className="h-12 flex items-center gap-2"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
