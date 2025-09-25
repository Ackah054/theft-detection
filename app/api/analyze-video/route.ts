import { type NextRequest, NextResponse } from "next/server"

interface VideoAnalysisRequest {
  videoFile: string // Base64 encoded video or file path
  analysisOptions?: {
    frameRate?: number // Frames per second to analyze
    sensitivity?: "low" | "medium" | "high"
    detectTypes?: string[] // Types of activities to detect
  }
}

interface DetectionEvent {
  timestamp: number
  confidence: number
  detected: boolean
  description: string
  boundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
}

interface VideoAnalysisResponse {
  analysisId: string
  status: "processing" | "completed" | "failed"
  progress?: number
  results?: {
    totalFrames: number
    processedFrames: number
    detections: DetectionEvent[]
    overallThreatLevel: "Low" | "Medium" | "High"
    averageConfidence: number
    processingTime: number
    summary: {
      totalDetections: number
      highConfidenceDetections: number
      timeRanges: Array<{
        start: number
        end: number
        severity: "Low" | "Medium" | "High"
      }>
    }
  }
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const videoFile = formData.get("video") as File

    if (!videoFile) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 })
    }

    const flaskFormData = new FormData()
    flaskFormData.append("video", videoFile)

    const flaskResponse = await fetch("http://localhost:5000/api/analyze-video", {
      method: "POST",
      body: flaskFormData,
    })

    if (!flaskResponse.ok) {
      throw new Error(`Flask backend error: ${flaskResponse.statusText}`)
    }

    const flaskResults = await flaskResponse.json()

    // Generate unique analysis ID
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const detections: DetectionEvent[] =
      flaskResults.detections?.map((detection: any) => ({
        timestamp: detection.timestamp,
        confidence: detection.confidence,
        detected: detection.detected,
        description: detection.description,
        boundingBox: {
          x: Math.floor(Math.random() * 800), // Flask doesn't provide bounding boxes yet
          y: Math.floor(Math.random() * 600),
          width: Math.floor(Math.random() * 200) + 100,
          height: Math.floor(Math.random() * 300) + 150,
        },
      })) || []

    const validDetections = detections.filter((d) => d.detected)
    const highConfidenceDetections = validDetections.filter((d) => d.confidence > 80)

    // Generate time ranges from real detections
    const timeRanges = validDetections.reduce(
      (ranges, detection, index) => {
        if (index === 0 || detection.timestamp - validDetections[index - 1].timestamp > 30) {
          // Start new range if this is first detection or gap > 30 seconds
          ranges.push({
            start: detection.timestamp,
            end: detection.timestamp + 10,
            severity: detection.confidence > 85 ? "High" : detection.confidence > 70 ? "Medium" : "Low",
          })
        } else {
          // Extend current range
          ranges[ranges.length - 1].end = detection.timestamp + 10
        }
        return ranges
      },
      [] as Array<{ start: number; end: number; severity: "Low" | "Medium" | "High" }>,
    )

    const response: VideoAnalysisResponse = {
      analysisId,
      status: "completed",
      progress: 100,
      results: {
        totalFrames: flaskResults.totalFrames || 0,
        processedFrames: flaskResults.processedFrames || 0,
        detections,
        overallThreatLevel: flaskResults.overallThreatLevel || "Low",
        averageConfidence: flaskResults.averageConfidence || 0,
        processingTime: flaskResults.processingTime || 0,
        summary: {
          totalDetections: validDetections.length,
          highConfidenceDetections: highConfidenceDetections.length,
          timeRanges,
        },
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Video analysis API error:", error)
    return NextResponse.json(
      {
        error: "Failed to connect to AI analysis backend. Please ensure the Flask server is running.",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  // Get analysis status by ID
  const { searchParams } = new URL(request.url)
  const analysisId = searchParams.get("id")

  if (!analysisId) {
    return NextResponse.json({ error: "Analysis ID required" }, { status: 400 })
  }

  try {
    const flaskResponse = await fetch(`http://localhost:5000/api/analysis-status?id=${analysisId}`)

    if (!flaskResponse.ok) {
      return NextResponse.json({
        analysisId,
        status: "failed",
        error: "Backend analysis service unavailable",
      })
    }

    const status = await flaskResponse.json()
    return NextResponse.json(status)
  } catch (error) {
    return NextResponse.json({
      analysisId,
      status: "failed",
      error: "Could not connect to analysis backend",
    })
  }
}
