"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, Play, Square, AlertTriangle, Activity, ArrowLeft, Shield } from "lucide-react"
import Link from "next/link"

interface DetectionResult {
  violence_detected: boolean
  confidence: number
  threat_level: string
  timestamp: string
}

interface AlertItem {
  id: string
  message: string
  confidence: number
  timestamp: string
  type: "theft" | "suspicious"
}

export default function LiveMonitor() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectionResults, setDetectionResults] = useState<DetectionResult | null>(null)
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const startCamera = async () => {
    try {
      setIsLoading(true)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("Error accessing camera. Please ensure camera permissions are granted.")
    } finally {
      setIsLoading(false)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    stopDetection()
  }

  const startDetection = () => {
    if (!stream) {
      alert("Please start the camera first!")
      return
    }

    setIsDetecting(true)
    detectionIntervalRef.current = setInterval(captureAndAnalyze, 3000) // Analyze every 3 seconds
  }

  const stopDetection = () => {
    setIsDetecting(false)
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }
    setDetectionResults(null)
  }

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions to match video
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight

    // Draw current video frame to canvas
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

    // Convert to base64 image
    const imageData = canvas.toDataURL("image/jpeg", 0.8)

    try {
      // Send frame to detection API
      const response = await fetch("/api/detect-frame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      })

      if (response.ok) {
        const result: DetectionResult = await response.json()
        setDetectionResults(result)

        // Add alert if theft detected
        if (result.violence_detected && result.confidence > 70) {
          const newAlert: AlertItem = {
            id: Date.now().toString(),
            message: `Theft detected with ${result.confidence}% confidence`,
            confidence: result.confidence,
            timestamp: new Date().toLocaleTimeString(),
            type: result.confidence > 80 ? "theft" : "suspicious",
          }

          setAlerts((prev) => [newAlert, ...prev.slice(0, 9)]) // Keep only last 10 alerts
        }
      }
    } catch (error) {
      console.error("Detection error:", error)
    }
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

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
                <h1 className="text-xl font-bold">Live Camera Monitoring</h1>
              </div>
            </div>
            <Badge
              variant={isDetecting ? "default" : "outline"}
              className={isDetecting ? "text-green-600 border-green-600" : ""}
            >
              <Activity className="h-3 w-3 mr-1" />
              {isDetecting ? "Detection Active" : "Detection Inactive"}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Feed */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Live Camera Feed
                </CardTitle>
                <CardDescription>Real-time video monitoring with AI-powered theft detection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Video Container */}
                <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Detection Alert Overlay */}
                  {detectionResults?.violence_detected && (
                    <div className="absolute top-4 left-4 right-4">
                      <Alert className="bg-red-600 border-red-600 text-white animate-pulse">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="font-medium">
                          THEFT DETECTED! Confidence: {detectionResults.confidence}%
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {/* No Camera Message */}
                  {!stream && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Camera Not Active</p>
                        <p className="text-sm opacity-75">Click "Start Camera" to begin monitoring</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Camera Controls */}
                <div className="flex gap-3">
                  {!stream ? (
                    <Button onClick={startCamera} disabled={isLoading} className="flex-1">
                      <Play className="h-4 w-4 mr-2" />
                      {isLoading ? "Starting..." : "Start Camera"}
                    </Button>
                  ) : (
                    <Button onClick={stopCamera} variant="destructive" className="flex-1">
                      <Square className="h-4 w-4 mr-2" />
                      Stop Camera
                    </Button>
                  )}

                  {stream && (
                    <Button
                      onClick={isDetecting ? stopDetection : startDetection}
                      variant={isDetecting ? "destructive" : "default"}
                      className="flex-1"
                    >
                      {isDetecting ? (
                        <>
                          <Square className="h-4 w-4 mr-2" />
                          Stop Detection
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start Detection
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detection Panel */}
          <div className="space-y-6">
            {/* Detection Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detection Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">AI Status:</span>
                    <Badge variant={isDetecting ? "default" : "outline"}>{isDetecting ? "Active" : "Inactive"}</Badge>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Threat Level:</span>
                    <Badge variant={detectionResults?.violence_detected ? "destructive" : "outline"}>
                      {detectionResults?.threat_level || "Low"}
                    </Badge>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Confidence:</span>
                    <span className="text-sm font-bold">{detectionResults?.confidence || "--"}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Alerts</CardTitle>
                <CardDescription>Latest detection events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No alerts yet. Start detection to monitor for suspicious activity.
                    </p>
                  ) : (
                    alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-3 rounded-lg border ${
                          alert.type === "theft"
                            ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                            : "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangle
                            className={`h-4 w-4 mt-0.5 ${alert.type === "theft" ? "text-red-600" : "text-orange-600"}`}
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium ${
                                alert.type === "theft"
                                  ? "text-red-900 dark:text-red-100"
                                  : "text-orange-900 dark:text-orange-100"
                              }`}
                            >
                              {alert.message}
                            </p>
                            <p
                              className={`text-xs ${
                                alert.type === "theft"
                                  ? "text-red-700 dark:text-red-300"
                                  : "text-orange-700 dark:text-orange-300"
                              }`}
                            >
                              {alert.timestamp}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
