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

    const flaskResponse = await fetch("http://localhost:5000/api/detect-frame", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: body.image,
        camera_id: body.camera_id || "live_cam",
        location: body.location || "Live Camera Feed",
      }),
    })

    if (!flaskResponse.ok) {
      throw new Error(`Flask backend error: ${flaskResponse.statusText}`)
    }

    const detectionResult = await flaskResponse.json()
    return NextResponse.json(detectionResult)
  } catch (error) {
    console.error("Detection API error:", error)
    return NextResponse.json(
      {
        error: "Failed to connect to AI detection backend. Please ensure the Flask server is running.",
      },
      { status: 500 },
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST to submit frames for detection." }, { status: 405 })
}
