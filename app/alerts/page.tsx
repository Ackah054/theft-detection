"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { AlertTriangle, CheckCircle, Clock, Search, Filter, ArrowLeft, Shield, Bell, Eye } from "lucide-react"
import Link from "next/link"

interface Alert {
  id: string
  timestamp: string
  type: "theft" | "suspicious" | "system"
  severity: "low" | "medium" | "high"
  confidence: number
  location: string
  description: string
  status: "active" | "acknowledged" | "resolved"
  metadata?: {
    cameraId?: string
    videoUrl?: string
    imageUrl?: string
    boundingBox?: {
      x: number
      y: number
      width: number
      height: number
    }
  }
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [severityFilter, setSeverityFilter] = useState<string>("all")

  useEffect(() => {
    fetchAlerts()
  }, [])

  useEffect(() => {
    filterAlerts()
  }, [alerts, searchTerm, statusFilter, typeFilter, severityFilter])

  const fetchAlerts = async () => {
    try {
      const response = await fetch("/api/alerts")
      if (response.ok) {
        const data = await response.json()
        setAlerts(data.alerts)
      }
    } catch (error) {
      console.error("Error fetching alerts:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterAlerts = () => {
    let filtered = [...alerts]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (alert) =>
          alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          alert.location.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((alert) => alert.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((alert) => alert.type === typeFilter)
    }

    // Severity filter
    if (severityFilter !== "all") {
      filtered = filtered.filter((alert) => alert.severity === severityFilter)
    }

    setFilteredAlerts(filtered)
  }

  const updateAlertStatus = async (alertId: string, newStatus: Alert["status"]) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setAlerts((prev) => prev.map((alert) => (alert.id === alertId ? { ...alert, status: newStatus } : alert)))
      }
    } catch (error) {
      console.error("Error updating alert:", error)
    }
  }

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "theft":
        return <AlertTriangle className="h-4 w-4" />
      case "suspicious":
        return <Eye className="h-4 w-4" />
      case "system":
        return <Bell className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: Alert["status"]) => {
    switch (status) {
      case "active":
        return "text-red-600 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
      case "acknowledged":
        return "text-orange-600 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800"
      case "resolved":
        return "text-green-600 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800"
    }
  }

  const getSeverityColor = (severity: Alert["severity"]) => {
    switch (severity) {
      case "high":
        return "destructive"
      case "medium":
        return "outline"
      case "low":
        return "secondary"
      default:
        return "outline"
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
    return date.toLocaleDateString()
  }

  const stats = {
    total: alerts.length,
    active: alerts.filter((a) => a.status === "active").length,
    acknowledged: alerts.filter((a) => a.status === "acknowledged").length,
    resolved: alerts.filter((a) => a.status === "resolved").length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading alerts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">Alert Management</h1>
              </div>
            </div>
            <Badge variant="outline">{stats.active} Active Alerts</Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Alerts</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-red-600">{stats.active}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Acknowledged</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.acknowledged}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="theft">Theft</SelectItem>
                  <SelectItem value="suspicious">Suspicious</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>

              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                  setTypeFilter("all")
                  setSeverityFilter("all")
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alerts List */}
        <Card>
          <CardHeader>
            <CardTitle>Alerts ({filteredAlerts.length})</CardTitle>
            <CardDescription>Manage and track all security alerts from your detection system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">No alerts found</p>
                  <p className="text-muted-foreground">
                    {alerts.length === 0
                      ? "No alerts have been generated yet."
                      : "Try adjusting your filters to see more results."}
                  </p>
                </div>
              ) : (
                filteredAlerts.map((alert) => (
                  <div key={alert.id} className={`p-4 rounded-lg border ${getStatusColor(alert.status)}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">{getAlertIcon(alert.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-sm">{alert.description}</h3>
                            <Badge variant={getSeverityColor(alert.severity)} className="text-xs">
                              {alert.severity.toUpperCase()}
                            </Badge>
                            {alert.confidence > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {alert.confidence}%
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{alert.location}</span>
                            <span>•</span>
                            <span>{formatTimestamp(alert.timestamp)}</span>
                            <span>•</span>
                            <span className="capitalize">{alert.type}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {alert.status === "active" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateAlertStatus(alert.id, "acknowledged")}
                            >
                              Acknowledge
                            </Button>
                            <Button size="sm" onClick={() => updateAlertStatus(alert.id, "resolved")}>
                              Resolve
                            </Button>
                          </>
                        )}
                        {alert.status === "acknowledged" && (
                          <Button size="sm" onClick={() => updateAlertStatus(alert.id, "resolved")}>
                            Resolve
                          </Button>
                        )}
                        {alert.status === "resolved" && (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Resolved
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
