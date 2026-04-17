import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createPickerSession, getPickerSession } from "@/lib/google-picker";

// POST /api/picker/session — Create a new Picker session
export async function POST() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the user's access token
  const account = await prisma.account.findFirst({
    where: {
      userId: session.user?.id,
      provider: "google",
    },
  });

  if (!account?.access_token) {
    return NextResponse.json(
      { error: "No Google access token found. Please sign in again." },
      { status: 401 }
    );
  }

  try {
    const pickerSession = await createPickerSession(account.access_token);
    return NextResponse.json({ success: true, data: pickerSession });
  } catch (error) {
    console.error("Failed to create picker session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create picker session" },
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

  const account = await prisma.account.findFirst({
    where: {
      userId: session.user?.id,
      provider: "google",
    },
  });

  if (!account?.access_token) {
    return NextResponse.json(
      { error: "No Google access token found" },
      { status: 401 }
    );
  }

  try {
    const pickerSession = await getPickerSession(
      account.access_token,
      sessionId
    );
    return NextResponse.json({ success: true, data: pickerSession });
  } catch (error) {
    console.error("Failed to poll picker session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to poll picker session" },
      { status: 500 }
    );
  }
}
