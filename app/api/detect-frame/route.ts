import { type NextRequest, NextResponse } from "next/server"

interface DetectionRequest {
  image: string // Base64 encoded image
  camera_id?: string
  location?: string
}

interface DetectionResponse {
  violence_detected: boolean
  confidence: number
  threat_level: "Low" | "Medium" | "High"
  timestamp: string
  model_used?: boolean
  alert_created?: boolean
  alert_id?: string
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: DetectionRequest = await request.json()

    if (!body.image) {
      return NextResponse.json({ error: "No image data provided" }, { status: 400 })
    }

    // Validate base64 image format
    if (!body.image.startsWith("data:image/")) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 })
    }

    const backendUrl = process.env.FLASK_BACKEND_URL || "http://localhost:5000"

    console.log("[v0] Sending frame detection request to:", backendUrl)

    const flaskResponse = await fetch(`${backendUrl}/api/detect-frame`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: body.image,
        camera_id: body.camera_id || "live_cam",
        location: body.location || "Live Camera Feed",
      }),
      signal: AbortSignal.timeout(30000), // 30 second timeout for AI processing
    })

    if (!flaskResponse.ok) {
      const errorText = await flaskResponse.text()
      console.error("[v0] Flask backend error:", flaskResponse.status, errorText)
      throw new Error(`Flask backend error: ${flaskResponse.status} - ${errorText}`)
    }

    const detectionResult = await flaskResponse.json()
    console.log("[v0] Detection result received:", detectionResult)

    return NextResponse.json(detectionResult)
  } catch (error) {
    console.error("[v0] Detection API error:", error)

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Detection request timed out. Please try again." }, { status: 408 })
    }

    return NextResponse.json(
      {
        error: `Failed to connect to AI detection backend: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: "Please ensure the Flask server is running and accessible.",
      },
      { status: 500 },
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST to submit frames for detection." }, { status: 405 })
}
