"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, Upload, Shield, AlertTriangle, Activity, Eye } from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  const [stats] = useState({
    totalCameras: 4,
    activeCameras: 3,
    alertsToday: 2,
    detectionAccuracy: 94.2,
  })

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
            <Badge variant="outline" className="text-green-600 border-green-600">
              <Activity className="h-3 w-3 mr-1" />
              System Active
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Cameras</CardTitle>
              <Camera className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.activeCameras}/{stats.totalCameras}
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
              <div className="text-2xl font-bold text-orange-600">{stats.alertsToday}</div>
              <p className="text-xs text-muted-foreground">Suspicious activities detected</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Detection Accuracy</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.detectionAccuracy}%</div>
              <p className="text-xs text-muted-foreground">AI model performance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Online</div>
              <p className="text-xs text-muted-foreground">All systems operational</p>
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
              <div className="flex items-center gap-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div className="flex-1">
                  <p className="font-medium text-red-900 dark:text-red-100">Suspicious Activity Detected</p>
                  <p className="text-sm text-red-700 dark:text-red-300">Camera 2 - Aisle 3 | Confidence: 87%</p>
                </div>
                <span className="text-xs text-red-600">2 min ago</span>
              </div>

              <div className="flex items-center gap-4 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div className="flex-1">
                  <p className="font-medium text-orange-900 dark:text-orange-100">Potential Theft Alert</p>
                  <p className="text-sm text-orange-700 dark:text-orange-300">Camera 1 - Entrance | Confidence: 72%</p>
                </div>
                <span className="text-xs text-orange-600">15 min ago</span>
              </div>

              <div className="flex items-center gap-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <Activity className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-green-900 dark:text-green-100">System Health Check</p>
                  <p className="text-sm text-green-700 dark:text-green-300">All cameras operational - Model updated</p>
                </div>
                <span className="text-xs text-green-600">1 hour ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
