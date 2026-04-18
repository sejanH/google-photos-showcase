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
  } catch (error) {
    console.error("Cron refresh failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const needsReauth =
      message.includes("scope is missing") ||
      message.includes("re-authenticate") ||
      message.includes("invalid_grant") ||
      message.includes("revoked");

    if (needsReauth) {
      return NextResponse.json(
        {
          error: "Session expired",
          requiresReauth: true,
          message: "Google authorization needs to be refreshed. Please sign in again.",
          details: message,
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Refresh failed", details: message },
      { status: 500 }
    );
  }
}
