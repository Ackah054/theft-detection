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

// Mock alert storage (in production, use a database)
const mockAlerts: Alert[] = [
  {
    id: "alert_001",
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
    type: "theft",
    severity: "high",
    confidence: 87,
    location: "Camera 2 - Aisle 3",
    description: "Suspicious behavior detected - person concealing item",
    status: "active",
    metadata: {
      cameraId: "cam_002",
      boundingBox: { x: 150, y: 200, width: 120, height: 180 },
    },
  },
  {
    id: "alert_002",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    type: "suspicious",
    severity: "medium",
    confidence: 72,
    location: "Camera 1 - Entrance",
    description: "Potential theft activity - item removal without payment",
    status: "acknowledged",
    metadata: {
      cameraId: "cam_001",
      boundingBox: { x: 300, y: 150, width: 100, height: 160 },
    },
  },
  {
    id: "alert_003",
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    type: "system",
    severity: "low",
    confidence: 100,
    location: "System",
    description: "All cameras operational - Model updated",
    status: "resolved",
    metadata: {},
  },
]

// GET /api/alerts - Fetch all alerts with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const severity = searchParams.get("severity")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let filteredAlerts = [...mockAlerts]

    // Apply filters
    if (status) {
      filteredAlerts = filteredAlerts.filter((alert) => alert.status === status)
    }
    if (type) {
      filteredAlerts = filteredAlerts.filter((alert) => alert.type === type)
    }
    if (severity) {
      filteredAlerts = filteredAlerts.filter((alert) => alert.severity === severity)
    }

    // Sort by timestamp (newest first)
    filteredAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Apply pagination
    const paginatedAlerts = filteredAlerts.slice(offset, offset + limit)

    return NextResponse.json({
      alerts: paginatedAlerts,
      total: filteredAlerts.length,
      offset,
      limit,
    })
  } catch (error) {
    console.error("Get alerts API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/alerts - Create new alert
export async function POST(request: NextRequest) {
  try {
    const body: CreateAlertRequest = await request.json()

    if (!body.type || !body.severity || !body.location || !body.description) {
      return NextResponse.json(
        { error: "Missing required fields: type, severity, location, description" },
        { status: 400 },
      )
    }

    const newAlert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: body.type,
      severity: body.severity,
      confidence: body.confidence || 0,
      location: body.location,
      description: body.description,
      status: "active",
      metadata: body.metadata || {},
    }

    mockAlerts.unshift(newAlert) // Add to beginning of array

    return NextResponse.json(newAlert, { status: 201 })
  } catch (error) {
    console.error("Create alert API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/alerts/[id] - Update alert status
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

    const alertIndex = mockAlerts.findIndex((alert) => alert.id === alertId)

    if (alertIndex === -1) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 })
    }

    mockAlerts[alertIndex].status = body.status

    return NextResponse.json(mockAlerts[alertIndex])
  } catch (error) {
    console.error("Update alert API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
