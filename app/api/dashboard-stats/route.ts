import { type NextRequest, NextResponse } from "next/server"

interface DashboardStats {
  totalCameras: number
  activeCameras: number
  alertsToday: number
  detectionAccuracy: number
  totalAlerts?: number
  activeAlerts?: number
  modelLoaded?: boolean
  systemStatus?: string
}

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.FLASK_BACKEND_URL || "http://localhost:5000"

    console.log("[v0] Fetching dashboard stats from:", backendUrl)

    const flaskResponse = await fetch(`${backendUrl}/api/dashboard-stats`, {
      method: "GET",
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!flaskResponse.ok) {
      const errorText = await flaskResponse.text()
      console.error("[v0] Flask backend error:", flaskResponse.status, errorText)
      throw new Error(`Flask backend error: ${flaskResponse.status} - ${errorText}`)
    }

    const stats: DashboardStats = await flaskResponse.json()
    console.log("[v0] Dashboard stats received:", stats)

    return NextResponse.json(stats)
  } catch (error) {
    console.error("[v0] Dashboard stats API error:", error)

    // Return fallback stats when backend is unavailable
    const fallbackStats: DashboardStats = {
      totalCameras: 4,
      activeCameras: 0, // Show 0 when backend is down
      alertsToday: 0,
      detectionAccuracy: 0,
      totalAlerts: 0,
      activeAlerts: 0,
      modelLoaded: false,
      systemStatus: "offline",
    }

    return NextResponse.json(
      {
        ...fallbackStats,
        error: `Backend unavailable: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 503 }, // Service Unavailable
    )
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json({ error: "Method not allowed. Use GET to fetch dashboard statistics." }, { status: 405 })
}
