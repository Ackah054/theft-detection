"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, Upload, Shield, AlertTriangle, Activity, Eye } from "lucide-react"
import Link from "next/link"
import { DeploymentStatus } from "@/components/deployment-status"

interface DashboardStats {
  totalCameras: number
  activeCameras: number
  alertsToday: number
  detectionAccuracy: number
}

interface RecentAlert {
  id: string
  timestamp: string
  type: string
  severity: string
  confidence: number
  location: string
  description: string
  status: string
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCameras: 0,
    activeCameras: 0,
    alertsToday: 0,
    detectionAccuracy: 0,
  })
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [backendConnected, setBackendConnected] = useState(false)

  useEffect(() => {
    fetchDashboardData()
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, alertsResponse] = await Promise.allSettled([
        fetch("/api/dashboard-stats").catch((err) => {
          console.log("[v0] Dashboard stats fetch failed:", err.message)
          return null
        }),
        fetch("/api/alerts?limit=3&status=active").catch((err) => {
          console.log("[v0] Alerts fetch failed:", err.message)
          return null
        }),
      ])

      // Handle stats response
      if (statsResponse.status === "fulfilled" && statsResponse.value && statsResponse.value.ok) {
        const statsData = await statsResponse.value.json()
        setStats(statsData)
        setBackendConnected(!statsData.error) // Check if there's an error field
        console.log("[v0] Dashboard stats loaded:", statsData)
      } else {
        // Fallback when backend is not available
        console.log("[v0] Using fallback dashboard stats")
        setStats({
          totalCameras: 4,
          activeCameras: 0, // Show 0 when backend is down
          alertsToday: 0,
          detectionAccuracy: 0,
        })
        setBackendConnected(false)
      }

      // Handle alerts response
      if (alertsResponse.status === "fulfilled" && alertsResponse.value && alertsResponse.value.ok) {
        const alertsData = await alertsResponse.value.json()
        setRecentAlerts(alertsData.alerts || [])
        console.log("[v0] Recent alerts loaded:", alertsData.alerts?.length || 0, "alerts")
      } else {
        console.log("[v0] No alerts data available")
        setRecentAlerts([])
      }
    } catch (error) {
      console.error("[v0] Dashboard data fetch error:", error)
      setBackendConnected(false)
      // Show system offline state
      setStats({
        totalCameras: 4,
        activeCameras: 0,
        alertsToday: 0,
        detectionAccuracy: 0,
      })
      setRecentAlerts([])
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const alertTime = new Date(timestamp)
    const diffMs = now.getTime() - alertTime.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} min ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">ShopGuard AI</h1>
                <p className="text-sm text-muted-foreground">Advanced Theft Detection System</p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={backendConnected ? "text-green-600 border-green-600" : "text-red-600 border-red-600"}
            >
              <Activity className="h-3 w-3 mr-1" />
              {backendConnected ? "System Active" : "System Offline"}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <DeploymentStatus />

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Cameras</CardTitle>
              <Camera className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : `${stats.activeCameras}/${stats.totalCameras}`}
              </div>
              <p className="text-xs text-muted-foreground">Monitoring live feeds</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{loading ? "..." : stats.alertsToday}</div>
              <p className="text-xs text-muted-foreground">Suspicious activities detected</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Detection Accuracy</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{loading ? "..." : `${stats.detectionAccuracy}%`}</div>
              <p className="text-xs text-muted-foreground">AI model performance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${backendConnected ? "text-green-600" : "text-red-600"}`}>
                {loading ? "..." : backendConnected ? "Online" : "Offline"}
              </div>
              <p className="text-xs text-muted-foreground">
                {backendConnected ? "All systems operational" : "Backend disconnected"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Live Camera Monitoring */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Camera className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Live Camera Monitoring</CardTitle>
                  <CardDescription>Monitor live camera feeds with real-time theft detection</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Features:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Real-time video analysis</li>
                  <li>• Instant theft detection alerts</li>
                  <li>• Multiple camera support</li>
                  <li>• Live confidence scoring</li>
                </ul>
              </div>
              <Link href="/live-monitor">
                <Button className="w-full" size="lg">
                  <Camera className="h-4 w-4 mr-2" />
                  Start Live Monitoring
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Video Upload Analysis */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Upload className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Video Upload Analysis</CardTitle>
                  <CardDescription>Upload recorded videos for detailed theft analysis</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Features:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Batch video processing</li>
                  <li>• Detailed analysis reports</li>
                  <li>• Timeline-based detection</li>
                  <li>• Export detection results</li>
                </ul>
              </div>
              <Link href="/video-upload">
                <Button className="w-full bg-transparent" size="lg" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Analyze Video
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Alert Management */}
        <div className="mt-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle>Alert Management</CardTitle>
                    <CardDescription>
                      View, manage, and track all security alerts from your detection system
                    </CardDescription>
                  </div>
                </div>
                <Link href="/alerts">
                  <Button variant="outline">View All Alerts</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{stats.alertsToday}</p>
                  <p className="text-sm text-muted-foreground">Active Alerts</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{stats.detectionAccuracy}%</p>
                  <p className="text-sm text-muted-foreground">Detection Accuracy</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">24/7</p>
                  <p className="text-sm text-muted-foreground">Monitoring</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest detection events and system updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">Loading recent activity...</div>
              ) : recentAlerts.length > 0 ? (
                recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-center gap-4 p-3 rounded-lg border ${
                      alert.severity === "high"
                        ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                        : alert.severity === "medium"
                          ? "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800"
                          : "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800"
                    }`}
                  >
                    <AlertTriangle
                      className={`h-5 w-5 ${
                        alert.severity === "high"
                          ? "text-red-600"
                          : alert.severity === "medium"
                            ? "text-orange-600"
                            : "text-yellow-600"
                      }`}
                    />
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          alert.severity === "high"
                            ? "text-red-900 dark:text-red-100"
                            : alert.severity === "medium"
                              ? "text-orange-900 dark:text-orange-100"
                              : "text-yellow-900 dark:text-yellow-100"
                        }`}
                      >
                        {alert.description}
                      </p>
                      <p
                        className={`text-sm ${
                          alert.severity === "high"
                            ? "text-red-700 dark:text-red-300"
                            : alert.severity === "medium"
                              ? "text-orange-700 dark:text-orange-300"
                              : "text-yellow-700 dark:text-yellow-300"
                        }`}
                      >
                        {alert.location} | Confidence: {alert.confidence}%
                      </p>
                    </div>
                    <span
                      className={`text-xs ${
                        alert.severity === "high"
                          ? "text-red-600"
                          : alert.severity === "medium"
                            ? "text-orange-600"
                            : "text-yellow-600"
                      }`}
                    >
                      {formatTimeAgo(alert.timestamp)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {backendConnected ? "No recent alerts" : "Connect to backend to view recent activity"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
