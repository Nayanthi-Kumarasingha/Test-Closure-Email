"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Eye, ArrowLeft } from "lucide-react"

interface Bug {
  title: string
  status: string
  severity: string
  isLegacy: boolean
  priority: string
}

export default function EmailTemplatePage() {
  const [releaseStatus, setReleaseStatus] = useState("")
  const [releaseVersion, setReleaseVersion] = useState("")
  const [devEmail, setDevEmail] = useState("")
  const [limitations, setLimitations] = useState("")
  const [testedAreas, setTestedAreas] = useState("")
  const [bugs, setBugs] = useState<Bug[]>([])
  const router = useRouter()
  const [reasonForStatus, setReasonForStatus] = useState("")

  const releaseStatusOptions = [
    "Good to go LIVE",
    "Good to go live with legacy issues",
    "Good to go live with minor issues",
    "Conditionally Ready",
    "Blocked Release",
    "Blocked by previous release issues",
  ]

  useEffect(() => {
    // Get release version from session storage
    const data = sessionStorage.getItem("releaseData")
    if (data) {
      const parsed = JSON.parse(data)
      setReleaseVersion(parsed.releaseVersion)
    }

    // Simulate AI-generated tested areas
    setTestedAreas(
      "Login functionality, Payment processing, User dashboard, API endpoints, Database operations, Security validations, Performance testing",
    )

    // Simulate bug data from filtered tickets
    setBugs([
      { title: "Login page styling issue", status: "Open", severity: "Medium", isLegacy: false, priority: "High" },
      { title: "Payment timeout error", status: "In Progress", severity: "High", isLegacy: true, priority: "Critical" },
      { title: "Dashboard loading delay", status: "Resolved", severity: "Low", isLegacy: false, priority: "Medium" },
    ])
  }, [])

  const handlePreview = () => {
    // Store email template data
    sessionStorage.setItem(
      "emailTemplate",
      JSON.stringify({
        releaseStatus,
        releaseVersion,
        devEmail,
        limitations,
        testedAreas,
        bugs,
        reasonForStatus,
      }),
    )
    router.push("/email-preview")
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-800">Email Template Configuration</CardTitle>
            <CardDescription className="text-lg text-gray-600">Configure the closure email template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="release-status" className="text-sm font-semibold text-gray-700">
                  Release Status *
                </Label>
                <Select value={releaseStatus} onValueChange={setReleaseStatus}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select release status" />
                  </SelectTrigger>
                  <SelectContent>
                    {releaseStatusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="release-version" className="text-sm font-semibold text-gray-700">
                  Release Version
                </Label>
                <Input
                  id="release-version"
                  value={releaseVersion}
                  onChange={(e) => setReleaseVersion(e.target.value)}
                  className="h-12"
                  readOnly
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dev-email" className="text-sm font-semibold text-gray-700">
                How is the Dev (Email for tagging)
              </Label>
              <Input
                id="dev-email"
                type="email"
                placeholder="developer@example.com"
                value={devEmail}
                onChange={(e) => setDevEmail(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="limitations" className="text-sm font-semibold text-gray-700">
                Limitations
              </Label>
              <Textarea
                id="limitations"
                placeholder="Describe any limitations or known issues..."
                value={limitations}
                onChange={(e) => setLimitations(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tested-areas" className="text-sm font-semibold text-gray-700">
                Tested Areas (AI Generated)
              </Label>
              <Textarea
                id="tested-areas"
                value={testedAreas}
                onChange={(e) => setTestedAreas(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            {releaseStatus && releaseStatus !== "Good to go LIVE" && (
              <div className="space-y-2">
                <Label htmlFor="reason-status" className="text-sm font-semibold text-gray-700">
                  Reason for Status *
                </Label>
                <Textarea
                  id="reason-status"
                  placeholder="Please explain the reason for this release status..."
                  value={reasonForStatus}
                  onChange={(e) => setReasonForStatus(e.target.value)}
                  className="min-h-[100px]"
                  required
                />
              </div>
            )}

            {releaseStatus && releaseStatus !== "Good to go LIVE" && (
              <div className="space-y-4">
                <Label className="text-sm font-semibold text-gray-700">Found Bugs Table</Label>
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 font-semibold text-gray-700 grid grid-cols-5 gap-4 text-sm">
                    <div>Bug Title</div>
                    <div>Status</div>
                    <div>Severity</div>
                    <div>Legacy</div>
                    <div>Priority</div>
                  </div>
                  {bugs.map((bug, index) => (
                    <div key={index} className="px-4 py-3 border-t grid grid-cols-5 gap-4 items-center text-sm">
                      <div className="font-medium">{bug.title}</div>
                      <div>{bug.status}</div>
                      <Badge className={getSeverityColor(bug.severity)}>{bug.severity}</Badge>
                      <div>{bug.isLegacy ? "Yes" : "No"}</div>
                      <Badge className={getPriorityColor(bug.priority)}>{bug.priority}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                onClick={handlePreview}
                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2"
                disabled={!releaseStatus || (releaseStatus !== "Good to go LIVE" && !reasonForStatus)}
              >
                <Eye className="h-5 w-5" />
                Preview Email
              </Button>

              <Button
                onClick={() => router.push("/summary")}
                variant="outline"
                className="h-12 flex items-center gap-2"
              >
                <ArrowLeft className="h-5 w-5" />
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
