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

    const backendUrl = process.env.FLASK_BACKEND_URL || "http://localhost:5000"
    const flaskUrl = new URL(`${backendUrl}/api/alerts`)
    if (status) flaskUrl.searchParams.set("status", status)
    if (type) flaskUrl.searchParams.set("type", type)
    if (severity) flaskUrl.searchParams.set("severity", severity)
    flaskUrl.searchParams.set("limit", limit)
    flaskUrl.searchParams.set("offset", offset)

    console.log("[v0] Fetching alerts from:", flaskUrl.toString())

    const flaskResponse = await fetch(flaskUrl.toString(), {
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!flaskResponse.ok) {
      const errorText = await flaskResponse.text()
      console.error("[v0] Flask backend error:", flaskResponse.status, errorText)
      throw new Error(`Flask backend error: ${flaskResponse.status} - ${errorText}`)
    }

    const alertsData = await flaskResponse.json()

    return NextResponse.json({
      alerts: alertsData.alerts || [],
      stats: alertsData.stats || {},
      total: alertsData.total || alertsData.filtered_count || 0,
      offset: Number.parseInt(offset),
      limit: Number.parseInt(limit),
    })
  } catch (error) {
    console.error("[v0] Get alerts API error:", error)
    return NextResponse.json(
      {
        error: `Failed to fetch alerts from backend: ${error instanceof Error ? error.message : "Unknown error"}`,
        alerts: [],
        stats: { total: 0, active: 0, acknowledged: 0, resolved: 0 },
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

    const backendUrl = process.env.FLASK_BACKEND_URL || "http://localhost:5000"
    const flaskResponse = await fetch(`${backendUrl}/api/alerts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    })

    if (!flaskResponse.ok) {
      const errorText = await flaskResponse.text()
      console.error("[v0] Flask backend error:", flaskResponse.status, errorText)
      throw new Error(`Flask backend error: ${flaskResponse.status} - ${errorText}`)
    }

    const newAlert = await flaskResponse.json()
    return NextResponse.json(newAlert, { status: 201 })
  } catch (error) {
    console.error("[v0] Create alert API error:", error)
    return NextResponse.json(
      {
        error: `Failed to create alert: ${error instanceof Error ? error.message : "Unknown error"}`,
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

    const backendUrl = process.env.FLASK_BACKEND_URL || "http://localhost:5000"
    const flaskResponse = await fetch(`${backendUrl}/api/alerts/${alertId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    })

    if (!flaskResponse.ok) {
      const errorText = await flaskResponse.text()
      console.error("[v0] Flask backend error:", flaskResponse.status, errorText)
      throw new Error(`Flask backend error: ${flaskResponse.status} - ${errorText}`)
    }

    const updatedAlert = await flaskResponse.json()
    return NextResponse.json(updatedAlert)
  } catch (error) {
    console.error("[v0] Update alert API error:", error)
    return NextResponse.json(
      {
        error: `Failed to update alert: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
