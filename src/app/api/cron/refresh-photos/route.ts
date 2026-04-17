import { NextRequest, NextResponse } from "next/server";
import { refreshBaseUrls } from "@/lib/media-service";

/**
 * Cron endpoint to refresh all photo baseUrls.
 * Should be called every 50-55 minutes.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Simple protection: check if Bearer token matches CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const refreshedCount = await refreshBaseUrls();
    return NextResponse.json({
      success: true,
      refreshed: refreshedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Cron refresh failed:", error);
    return NextResponse.json(
      { error: "Refresh failed", details: error.message },
      { status: 500 }
    );
  }
}
