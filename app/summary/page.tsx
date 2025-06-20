"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Bug, FileText, ArrowLeft } from "lucide-react"

interface TicketSummary {
  open: number
  inProgress: number
  inDevelopment: number
  inQA: number
  qaCompleted: number
  reportedBugs: number
}

export default function SummaryPage() {
  const [summary, setSummary] = useState<TicketSummary>({
    open: 0,
    inProgress: 0,
    inDevelopment: 0,
    inQA: 0,
    qaCompleted: 0,
    reportedBugs: 0,
  })
  const router = useRouter()

  useEffect(() => {
    // Simulate fetching ticket summary - replace with actual Jira API call
    setSummary({
      open: Math.floor(Math.random() * 20) + 5,
      inProgress: Math.floor(Math.random() * 15) + 3,
      inDevelopment: Math.floor(Math.random() * 10) + 2,
      inQA: Math.floor(Math.random() * 8) + 1,
      qaCompleted: Math.floor(Math.random() * 25) + 10,
      reportedBugs: Math.floor(Math.random() * 5) + 1,
    })
  }, [])

  const handleReviewBugs = () => {
    router.push("/bug-summary")
  }

  const handleSendClosureEmail = () => {
    router.push("/email-template")
  }

  const summaryItems = [
    { label: "Open Tickets", value: summary.open, color: "bg-red-100 text-red-800" },
    { label: "In Progress", value: summary.inProgress, color: "bg-yellow-100 text-yellow-800" },
    { label: "In Development", value: summary.inDevelopment, color: "bg-blue-100 text-blue-800" },
    { label: "In QA", value: summary.inQA, color: "bg-purple-100 text-purple-800" },
    { label: "QA Completed", value: summary.qaCompleted, color: "bg-green-100 text-green-800" },
    { label: "Reported Bugs", value: summary.reportedBugs, color: "bg-orange-100 text-orange-800" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto pt-8">
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-800">Release Summary</CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Overview of ticket statuses for the current release
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {summaryItems.map((item, index) => (
                <div key={index} className={`p-4 rounded-lg ${item.color}`}>
                  <div className="text-2xl font-bold">{item.value}</div>
                  <div className="text-sm font-medium">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-8">
              <Button
                onClick={handleReviewBugs}
                className="h-16 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-lg flex items-center gap-2"
              >
                <Bug className="h-5 w-5" />
                Review Previous Bugs
              </Button>

              <Button
                onClick={handleSendClosureEmail}
                className="h-16 bg-green-600 hover:bg-green-700 text-white font-semibold text-lg flex items-center gap-2"
              >
                <FileText className="h-5 w-5" />
                Send Closure Email
              </Button>
            </div>

            <Button onClick={() => router.push("/")} variant="outline" className="w-full h-12 flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
