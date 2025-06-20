"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { AlertTriangle, Mail, ArrowRight } from "lucide-react"

interface ReleaseData {
  releaseVersion: string
  selectedLabel: string
  selectedComponent: string
}

export default function DevNotificationPage() {
  const [releaseData, setReleaseData] = useState<ReleaseData | null>(null)
  const [ticketsWithoutVersion, setTicketsWithoutVersion] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const data = sessionStorage.getItem("releaseData")
    if (data) {
      const parsed = JSON.parse(data)
      setReleaseData(parsed)
      // Simulate filtering tickets - replace with actual Jira API call
      setTicketsWithoutVersion(Math.floor(Math.random() * 10) + 1)
    } else {
      router.push("/")
    }
  }, [router])

  const handleInformDev = async () => {
    setIsLoading(true)

    // Simulate sending emails to developers
    await new Promise((resolve) => setTimeout(resolve, 2000))

    alert("Notification emails sent to developers successfully!")
    setIsLoading(false)
  }

  const handleContinue = () => {
    router.push("/summary")
  }

  if (!releaseData) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              Ticket Analysis Results
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Release: {releaseData.releaseVersion} | Label: {releaseData.selectedLabel} | Component:{" "}
              {releaseData.selectedComponent}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 font-medium">
                Identified <span className="font-bold text-xl">{ticketsWithoutVersion}</span> tickets with Dev Released
                status without a release version.
              </AlertDescription>
            </Alert>

            <div className="grid md:grid-cols-2 gap-4">
              <Button
                onClick={handleInformDev}
                disabled={isLoading}
                className="h-16 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-lg flex items-center gap-2"
              >
                <Mail className="h-5 w-5" />
                {isLoading ? "Sending Notifications..." : "Inform Dev"}
              </Button>

              <Button
                onClick={handleContinue}
                className="h-16 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg flex items-center gap-2"
              >
                Continue Closure Email Generation
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
