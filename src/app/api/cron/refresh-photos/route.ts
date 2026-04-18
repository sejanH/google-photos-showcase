import { NextRequest, NextResponse } from "next/server";
import { refreshBaseUrls } from "@/lib/media-service";

/**
 * Cron endpoint to download missing photo files.
 * Will find any photos that haven't been cached locally yet
 * and download them if their temporary Google URL is still valid.
 */
export async function GET(req: NextRequest) {
  const googleOnlyMode = process.env.GOOGLE_ONLY_MODE === "true";
  const authHeader = req.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Simple protection: check if Bearer token matches CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (googleOnlyMode) {
    return NextResponse.json({
      success: true,
      skipped: true,
      mode: "google-only",
      message:
        "Cron refresh is disabled in GOOGLE_ONLY_MODE. Re-authenticate and re-pick photos when URLs expire.",
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const refreshedCount = await refreshBaseUrls();
    return NextResponse.json({
      success: true,
      refreshed: refreshedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Download sync failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Download sync failed", details: message },
      { status: 500 }
    );
  }
}
