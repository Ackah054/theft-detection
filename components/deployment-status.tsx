"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface BackendStatus {
  connected: boolean
  url: string
  error?: string
}

export function DeploymentStatus() {
  const [status, setStatus] = useState<BackendStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await fetch("/api/dashboard-stats").catch((err) => {
          console.log("[v0] Backend status check failed:", err.message)
          return null
        })

        if (response && response.ok) {
          const data = await response.json()

          if (data.error && data.error.includes("Backend unavailable")) {
            setStatus({
              connected: false,
              url: "localhost:5000 (fallback)",
              error: data.error,
            })
          } else {
            setStatus({
              connected: true,
              url: "Flask backend connected",
            })
          }
        } else {
          setStatus({
            connected: false,
            url: "API unavailable",
            error: "Could not reach dashboard API",
          })
        }
      } catch (error) {
        console.log("[v0] Backend status check error:", error)
        setStatus({
          connected: false,
          url: "Unknown",
          error: error instanceof Error ? error.message : "Connection failed",
        })
      } finally {
        setIsLoading(false)
      }
    }

    checkBackendStatus()
  }, [])

  if (isLoading) return null

  if (!status) return null

  if (status.connected) {
    return (
      <Alert className="mb-4 border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">Backend connected and operational</AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="mb-4 border-yellow-200 bg-yellow-50">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800">
        <strong>Demo Mode:</strong> Flask backend not connected. Showing mock data for demonstration.
        <br />
        <small className="text-yellow-700">
          To connect your backend, set the FLASK_BACKEND_URL environment variable in your deployment settings.
        </small>
      </AlertDescription>
    </Alert>
  )
}
