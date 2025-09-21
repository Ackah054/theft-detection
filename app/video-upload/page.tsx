"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, RotateCcw, Download, AlertTriangle, ArrowLeft, Shield, FileVideo, Clock, Eye } from "lucide-react"
import Link from "next/link"

interface AnalysisResult {
  timestamp: number
  confidence: number
  detected: boolean
  description: string
}

interface VideoAnalysis {
  totalFrames: number
  processedFrames: number
  detections: AnalysisResult[]
  overallThreatLevel: "Low" | "Medium" | "High"
  averageConfidence: number
  processingTime: number
}

export default function VideoUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisResults, setAnalysisResults] = useState<VideoAnalysis | null>(null)
  const [videoUrl, setVideoUrl] = useState<string>("")
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("video/")) {
      setSelectedFile(file)
      setVideoUrl(URL.createObjectURL(file))
      setAnalysisResults(null)
      setAnalysisProgress(0)
    } else {
      alert("Please select a valid video file")
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file && file.type.startsWith("video/")) {
      setSelectedFile(file)
      setVideoUrl(URL.createObjectURL(file))
      setAnalysisResults(null)
      setAnalysisProgress(0)
    }
  }

  const startAnalysis = async () => {
    if (!selectedFile) return

    setIsAnalyzing(true)
    setAnalysisProgress(0)

    // Simulate video analysis with progress updates
    const totalSteps = 100
    const interval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= totalSteps) {
          clearInterval(interval)
          // Simulate analysis results
          const mockResults: VideoAnalysis = {
            totalFrames: 1800,
            processedFrames: 1800,
            detections: [
              {
                timestamp: 45.2,
                confidence: 87,
                detected: true,
                description: "Suspicious behavior detected - person concealing item",
              },
              {
                timestamp: 127.8,
                confidence: 72,
                detected: true,
                description: "Potential theft activity - item removal without payment",
              },
              {
                timestamp: 203.5,
                confidence: 91,
                detected: true,
                description: "High confidence theft detection - concealment behavior",
              },
            ],
            overallThreatLevel: "High",
            averageConfidence: 83,
            processingTime: 45,
          }
          setAnalysisResults(mockResults)
          setIsAnalyzing(false)
          return totalSteps
        }
        return prev + 1
      })
    }, 50)
  }

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const seekToTimestamp = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp
      setCurrentTime(timestamp)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const exportResults = () => {
    if (!analysisResults) return

    const data = {
      filename: selectedFile?.name,
      analysis: analysisResults,
      exportDate: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analysis-${selectedFile?.name || "video"}.json`
    a.click()
    URL.revokeObjectURL(url)
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
                <h1 className="text-xl font-bold">Video Upload & Analysis</h1>
              </div>
            </div>
            {analysisResults && (
              <Badge variant={analysisResults.overallThreatLevel === "High" ? "destructive" : "outline"}>
                Threat Level: {analysisResults.overallThreatLevel}
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Upload & Player */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Section */}
            {!selectedFile && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload Video for Analysis
                  </CardTitle>
                  <CardDescription>
                    Upload CCTV footage or recorded videos to detect theft and suspicious activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileVideo className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-2">Drop your video here or click to browse</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Supports MP4, AVI, MOV, and other common video formats
                    </p>
                    <Button>
                      <Upload className="h-4 w-4 mr-2" />
                      Select Video File
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </CardContent>
              </Card>
            )}

            {/* Video Player */}
            {selectedFile && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileVideo className="h-5 w-5" />
                        {selectedFile.name}
                      </CardTitle>
                      <CardDescription>
                        Video ready for analysis • {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null)
                        setVideoUrl("")
                        setAnalysisResults(null)
                      }}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Video Container */}
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      className="w-full h-full object-contain"
                      onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      controls
                    />
                  </div>

                  {/* Analysis Controls */}
                  <div className="flex gap-3">
                    <Button onClick={startAnalysis} disabled={isAnalyzing} className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      {isAnalyzing ? "Analyzing..." : "Start Analysis"}
                    </Button>

                    {analysisResults && (
                      <Button onClick={exportResults} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export Results
                      </Button>
                    )}
                  </div>

                  {/* Analysis Progress */}
                  {isAnalyzing && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Analyzing video frames...</span>
                        <span>{analysisProgress}%</span>
                      </div>
                      <Progress value={analysisProgress} className="w-full" />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Analysis Results */}
          <div className="space-y-6">
            {/* Analysis Summary */}
            {analysisResults && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Analysis Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Frames:</span>
                      <p className="font-medium">{analysisResults.totalFrames.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Processing Time:</span>
                      <p className="font-medium">{analysisResults.processingTime}s</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Detections:</span>
                      <p className="font-medium text-red-600">{analysisResults.detections.length}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Avg. Confidence:</span>
                      <p className="font-medium">{analysisResults.averageConfidence}%</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Badge
                      variant={analysisResults.overallThreatLevel === "High" ? "destructive" : "outline"}
                      className="w-full justify-center"
                    >
                      Overall Threat: {analysisResults.overallThreatLevel}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detection Timeline */}
            {analysisResults && analysisResults.detections.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detection Timeline</CardTitle>
                  <CardDescription>Click on any detection to jump to that moment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {analysisResults.detections.map((detection, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg border bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 cursor-pointer hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors"
                        onClick={() => seekToTimestamp(detection.timestamp)}
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="h-3 w-3 text-red-600" />
                              <span className="text-sm font-medium text-red-900 dark:text-red-100">
                                {formatTime(detection.timestamp)}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {detection.confidence}%
                              </Badge>
                            </div>
                            <p className="text-xs text-red-700 dark:text-red-300">{detection.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            {!selectedFile && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How It Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium flex-shrink-0">
                      1
                    </div>
                    <p>Upload your CCTV footage or recorded video file</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium flex-shrink-0">
                      2
                    </div>
                    <p>Our AI analyzes each frame for suspicious activities</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium flex-shrink-0">
                      3
                    </div>
                    <p>Review detailed results with timestamps and confidence scores</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium flex-shrink-0">
                      4
                    </div>
                    <p>Export analysis reports for documentation</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
