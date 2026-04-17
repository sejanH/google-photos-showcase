import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createPickerSession, getPickerSession } from "@/lib/google-picker";
import { getAdminAccessToken } from "@/lib/media-service";

// POST /api/picker/session — Create a new Picker session
export async function POST() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get a fresh access token (handles refresh automatically)
    const accessToken = await getAdminAccessToken();
    const pickerSession = await createPickerSession(accessToken);
    return NextResponse.json({ success: true, data: pickerSession });
  } catch (error) {
    console.error("Failed to create picker session:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create picker session" },
      { status: 500 }
    );
  }
}

// GET /api/picker/session?sessionId=... — Poll a Picker session
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 }
    );
  }

  try {
    const accessToken = await getAdminAccessToken();
    const pickerSession = await getPickerSession(accessToken, sessionId);
    return NextResponse.json({ success: true, data: pickerSession });
  } catch (error) {
    console.error("Failed to poll picker session:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to poll picker session" },
      { status: 500 }
    );
  }
}
