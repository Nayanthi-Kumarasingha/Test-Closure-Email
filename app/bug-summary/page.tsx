"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Mail, ArrowLeft, ExternalLink } from "lucide-react"

interface Bug {
  id: string
  title: string
  priority: string
  status: string
  link: string
}

interface BugCategories {
  prioritized: Bug[]
  redevelopment: Bug[]
  devReleased: Bug[]
}

export default function BugSummaryPage() {
  const [bugs, setBugs] = useState<BugCategories>({
    prioritized: [],
    redevelopment: [],
    devReleased: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Simulate fetching previous release bugs - replace with actual Jira API call
    setBugs({
      prioritized: [
        {
          id: "BUG-001",
          title: "Login page not responsive",
          priority: "High",
          status: "Open",
          link: "https://jira.example.com/BUG-001",
        },
        {
          id: "BUG-002",
          title: "Payment gateway timeout",
          priority: "Critical",
          status: "In Progress",
          link: "https://jira.example.com/BUG-002",
        },
      ],
      redevelopment: [
        {
          id: "BUG-003",
          title: "UI alignment issues",
          priority: "Medium",
          status: "Redevelopment",
          link: "https://jira.example.com/BUG-003",
        },
      ],
      devReleased: [
        {
          id: "BUG-004",
          title: "Performance optimization",
          priority: "Low",
          status: "Dev Released",
          link: "https://jira.example.com/BUG-004",
        },
      ],
    })
  }, [])

  const handleSendEmailToProduct = async () => {
    setIsLoading(true)

    // Simulate sending email to product team
    await new Promise((resolve) => setTimeout(resolve, 2000))

    alert("Email sent to product team successfully!")
    setIsLoading(false)
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

  const BugList = ({ title, bugs }: { title: string; bugs: Bug[] }) => (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg text-gray-800">
        {title} ({bugs.length})
      </h3>
      {bugs.length === 0 ? (
        <p className="text-gray-500 italic">No bugs in this category</p>
      ) : (
        <div className="space-y-2">
          {bugs.map((bug) => (
            <div key={bug.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800">{bug.id}</span>
                  <Badge className={getPriorityColor(bug.priority)}>{bug.priority}</Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">{bug.title}</p>
              </div>
              <a
                href={bug.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-800">Previous Release Bug Summary</CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Bugs identified from previous release with same component
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <BugList title="Prioritized Bugs" bugs={bugs.prioritized} />
            <BugList title="Redevelopment Bugs" bugs={bugs.redevelopment} />
            <BugList title="Dev Released Bugs" bugs={bugs.devReleased} />

            <div className="grid md:grid-cols-2 gap-4 mt-8">
              <Button
                onClick={handleSendEmailToProduct}
                disabled={isLoading}
                className="h-16 bg-red-600 hover:bg-red-700 text-white font-semibold text-lg flex items-center gap-2"
              >
                <Mail className="h-5 w-5" />
                {isLoading ? "Sending Email..." : "Send Email to Product Team"}
              </Button>

              <Button
                onClick={() => router.push("/summary")}
                variant="outline"
                className="h-16 flex items-center gap-2"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Summary
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
