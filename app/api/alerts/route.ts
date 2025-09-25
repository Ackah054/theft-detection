import { type NextRequest, NextResponse } from "next/server"

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

interface CreateAlertRequest {
  type: Alert["type"]
  severity: Alert["severity"]
  confidence: number
  location: string
  description: string
  metadata?: Alert["metadata"]
}

interface UpdateAlertRequest {
  status: Alert["status"]
}

// GET /api/alerts - Fetch all alerts from Flask backend
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const severity = searchParams.get("severity")
    const limit = searchParams.get("limit") || "50"
    const offset = searchParams.get("offset") || "0"

    const flaskUrl = new URL("http://localhost:5000/api/alerts")
    if (status) flaskUrl.searchParams.set("status", status)
    if (type) flaskUrl.searchParams.set("type", type)
    if (severity) flaskUrl.searchParams.set("severity", severity)
    flaskUrl.searchParams.set("limit", limit)
    flaskUrl.searchParams.set("offset", offset)

    const flaskResponse = await fetch(flaskUrl.toString())

    if (!flaskResponse.ok) {
      throw new Error(`Flask backend error: ${flaskResponse.statusText}`)
    }

    const alertsData = await flaskResponse.json()

    return NextResponse.json({
      alerts: alertsData.alerts || [],
      total: alertsData.total || 0,
      offset: Number.parseInt(offset),
      limit: Number.parseInt(limit),
    })
  } catch (error) {
    console.error("Get alerts API error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch alerts from backend. Please ensure the Flask server is running.",
        alerts: [],
        total: 0,
        offset: 0,
        limit: 50,
      },
      { status: 500 },
    )
  }
}

// POST /api/alerts - Create new alert via Flask backend
export async function POST(request: NextRequest) {
  try {
    const body: CreateAlertRequest = await request.json()

    if (!body.type || !body.severity || !body.location || !body.description) {
      return NextResponse.json(
        { error: "Missing required fields: type, severity, location, description" },
        { status: 400 },
      )
    }

    const flaskResponse = await fetch("http://localhost:5000/api/alerts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!flaskResponse.ok) {
      throw new Error(`Flask backend error: ${flaskResponse.statusText}`)
    }

    const newAlert = await flaskResponse.json()
    return NextResponse.json(newAlert, { status: 201 })
  } catch (error) {
    console.error("Create alert API error:", error)
    return NextResponse.json(
      {
        error: "Failed to create alert. Please ensure the Flask server is running.",
      },
      { status: 500 },
    )
  }
}

// PUT /api/alerts/[id] - Update alert status via Flask backend
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const alertId = url.pathname.split("/").pop()

    if (!alertId) {
      return NextResponse.json({ error: "Alert ID required" }, { status: 400 })
    }

    const body: UpdateAlertRequest = await request.json()

    if (!body.status) {
      return NextResponse.json({ error: "Status field required" }, { status: 400 })
    }

    const flaskResponse = await fetch(`http://localhost:5000/api/alerts/${alertId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!flaskResponse.ok) {
      throw new Error(`Flask backend error: ${flaskResponse.statusText}`)
    }

    const updatedAlert = await flaskResponse.json()
    return NextResponse.json(updatedAlert)
  } catch (error) {
    console.error("Update alert API error:", error)
    return NextResponse.json(
      {
        error: "Failed to update alert. Please ensure the Flask server is running.",
      },
      { status: 500 },
    )
  }
}
