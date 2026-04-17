import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/settings
export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let settings = await prisma.siteSettings.findFirst({
    where: { id: "default" },
  });

  // Create default settings if they don't exist
  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: { id: "default" },
    });
  }

  return NextResponse.json({ success: true, data: settings });
}

// PUT /api/settings
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { siteName, siteTagline, ownerName, socialLinks } = body;

    const settings = await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: {
        siteName: siteName || "Photo Showcase",
        siteTagline: siteTagline || null,
        ownerName: ownerName || null,
        socialLinks: socialLinks ? JSON.stringify(socialLinks) : null,
      },
      create: {
        id: "default",
        siteName: siteName || "Photo Showcase",
        siteTagline: siteTagline || null,
        ownerName: ownerName || null,
        socialLinks: socialLinks ? JSON.stringify(socialLinks) : null,
      },
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error("Failed to save settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
