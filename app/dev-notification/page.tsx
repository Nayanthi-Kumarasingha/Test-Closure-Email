"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"
import { AlertTriangle, Mail, ArrowRight, ExternalLink, User, Tag, Layers } from "lucide-react"

interface Ticket {
  key: string
  summary: string
  assignee: string
  status: string
  labels: string[]
  components: string[]
  releaseVersion: string | null
}

interface ReleaseData {
  releaseVersion: string
  selectedLabel: string
  selectedComponent: string
  tickets: Ticket[]
  totalCount: number
}

export default function DevNotificationPage() {
  const [releaseData, setReleaseData] = useState<ReleaseData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const data = sessionStorage.getItem("releaseData")
    if (data) {
      try {
        const parsed = JSON.parse(data)
        setReleaseData(parsed)
      } catch (err) {
        setError("Invalid data format")
        router.push("/")
      }
    } else {
      router.push("/")
    }
  }, [router])

  const handleInformDev = async () => {
    setIsLoading(true)

    try {
      // Call the inform-dev API
      const response = await fetch('/api/inform-dev', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tickets: releaseData?.tickets,
          releaseVersion: releaseData?.releaseVersion,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send notifications')
      }

      alert("Notification emails sent to developers successfully!")
    } catch (err: any) {
      alert(`Error sending notifications: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinue = () => {
    router.push("/summary")
  }

  const openJiraTicket = (ticketKey: string) => {
    const jiraUrl = process.env.NEXT_PUBLIC_JIRA_BASE_URL || 'https://your-domain.atlassian.net'
    window.open(`${jiraUrl}/browse/${ticketKey}`, '_blank')
  }

  if (!releaseData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ticket data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
            <Button onClick={() => router.push("/")} className="w-full mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto pt-8">
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              Filtered Tickets Analysis
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
                Found <span className="font-bold text-xl">{releaseData.totalCount}</span> tickets with Dev Released
                status without a release version.
              </AlertDescription>
            </Alert>

            {releaseData.tickets.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">Tickets Requiring Release Version</h3>
                  <Badge variant="secondary" className="text-sm">
                    {releaseData.totalCount} tickets
                  </Badge>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Ticket Key</TableHead>
                        <TableHead className="font-semibold">Summary</TableHead>
                        <TableHead className="font-semibold">Assignee</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Labels</TableHead>
                        <TableHead className="font-semibold">Components</TableHead>
                        <TableHead className="font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {releaseData.tickets.map((ticket) => (
                        <TableRow key={ticket.key} className="hover:bg-gray-50">
                          <TableCell className="font-mono text-sm">
                            <Button
                              variant="link"
                              className="p-0 h-auto font-mono text-blue-600 hover:text-blue-800"
                              onClick={() => openJiraTicket(ticket.key)}
                            >
                              {ticket.key}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                          </TableCell>
                          <TableCell className="max-w-xs truncate" title={ticket.summary}>
                            {ticket.summary}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-gray-500" />
                              <span className="text-sm">{ticket.assignee}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {ticket.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-32">
                              {ticket.labels.slice(0, 2).map((label) => (
                                <Badge key={label} variant="secondary" className="text-xs">
                                  <Tag className="h-2 w-2 mr-1" />
                                  {label}
                                </Badge>
                              ))}
                              {ticket.labels.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{ticket.labels.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-32">
                              {ticket.components.slice(0, 2).map((component) => (
                                <Badge key={component} variant="outline" className="text-xs">
                                  <Layers className="h-2 w-2 mr-1" />
                                  {component}
                                </Badge>
                              ))}
                              {ticket.components.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{ticket.components.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openJiraTicket(ticket.key)}
                              className="text-xs"
                            >
                              View in Jira
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-green-600 mb-2">
                  <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Tickets Found</h3>
                <p className="text-gray-600">All tickets have proper release versions assigned.</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4 pt-4">
              <Button
                onClick={handleInformDev}
                disabled={isLoading || releaseData.tickets.length === 0}
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
