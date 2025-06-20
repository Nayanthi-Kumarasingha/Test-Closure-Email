"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

interface JiraData {
  labels: string[]
  components: Array<{ name: string; id: string }>
}

export default function HomePage() {
  const [fixVersion, setFixVersion] = useState("")
  const [selectedLabel, setSelectedLabel] = useState("")
  const [selectedComponent, setSelectedComponent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [jiraData, setJiraData] = useState<JiraData>({ labels: [], components: [] })
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Fetch Jira data on component mount
  useEffect(() => {
    const fetchJiraData = async () => {
      try {
        setIsDataLoading(true)
        setError(null)

        // Fetch labels and components in parallel
        const [labelsResponse, componentsResponse] = await Promise.all([
          fetch('/api/jira/labels'),
          fetch('/api/jira/components')
        ])

        if (!labelsResponse.ok || !componentsResponse.ok) {
          throw new Error('Failed to fetch Jira data')
        }

        const labelsData = await labelsResponse.json()
        const componentsData = await componentsResponse.json()

        setJiraData({
          labels: labelsData.labels || [],
          components: componentsData.components || []
        })
      } catch (err: any) {
        console.error('Error fetching Jira data:', err)
        setError(err.message || 'Failed to load Jira data')
        // Fallback to dummy data if API fails
        setJiraData({
          labels: ["S138", "S137", "S136", "S135", "S134"],
          components: [
            { name: "BM", id: "1" },
            { name: "FM", id: "2" },
            { name: "OM", id: "3" },
            { name: "PM", id: "4" },
            { name: "SM", id: "5" }
          ]
        })
      } finally {
        setIsDataLoading(false)
      }
    }

    fetchJiraData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fixVersion || !selectedLabel || !selectedComponent) return

    setIsLoading(true)
    setError(null)

    try {
      // Fetch filtered tickets from Jira
      const response = await fetch('/api/jira/filter-tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          label: selectedLabel,
          component: selectedComponent,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch tickets from Jira')
      }

      const ticketData = await response.json()
      
      if (ticketData.error) {
        throw new Error(ticketData.error)
      }

      // Store form data and ticket data in sessionStorage for use across pages
      sessionStorage.setItem(
        "releaseData",
        JSON.stringify({
          fixVersion,
          selectedLabel,
          selectedComponent,
          tickets: ticketData.tickets,
          totalCount: ticketData.totalCount,
        }),
      )

      // Navigate to dev notification page
      router.push("/dev-notification")
    } catch (err: any) {
      console.error('Error fetching tickets:', err)
      setError(err.message || 'Failed to fetch tickets from Jira')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold text-gray-800">Test Closure Email System</CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Configure release parameters to generate closure emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800 text-sm">
                  ⚠️ {error} - Using fallback data. Please check your Jira configuration.
                </p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fix-version" className="text-sm font-semibold text-gray-700">
                  Fix Version *
                </Label>
                <Input
                  id="fix-version"
                  type="text"
                  placeholder="e.g., v1.2.3"
                  value={fixVersion}
                  onChange={(e) => setFixVersion(e.target.value)}
                  className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="label-select" className="text-sm font-semibold text-gray-700">
                  Select Label *
                </Label>
                <Select value={selectedLabel} onValueChange={setSelectedLabel} required disabled={isDataLoading}>
                  <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder={isDataLoading ? "Loading labels..." : "Choose a label from Jira"} />
                  </SelectTrigger>
                  <SelectContent>
                    {jiraData.labels.map((label) => (
                      <SelectItem key={label} value={label}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="component-select" className="text-sm font-semibold text-gray-700">
                  Select Component *
                </Label>
                <Select value={selectedComponent} onValueChange={setSelectedComponent} required disabled={isDataLoading}>
                  <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder={isDataLoading ? "Loading components..." : "Choose a component from Jira"} />
                  </SelectTrigger>
                  <SelectContent>
                    {jiraData.components.map((component) => (
                      <SelectItem key={component.id} value={component.name}>
                        {component.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg"
                disabled={isLoading || isDataLoading}
              >
                {isLoading ? "Processing..." : isDataLoading ? "Loading..." : "Submit & Analyze Tickets"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
