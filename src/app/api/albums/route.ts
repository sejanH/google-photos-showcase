import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/albums — List all albums (admin only)
export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const albums = await prisma.album.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { photos: true } },
    },
  });

  return NextResponse.json({ success: true, data: albums });
}

// POST /api/albums — Create a new album
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, slug, description } = body;

    if (!title || !slug) {
      return NextResponse.json(
        { error: "Title and slug are required" },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existing = await prisma.album.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "An album with this slug already exists" },
        { status: 409 }
      );
    }

    const album = await prisma.album.create({
      data: {
        title,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        description: description || null,
      },
    });

    return NextResponse.json({ success: true, data: album }, { status: 201 });
  } catch (error) {
    console.error("Failed to create album:", error);
    return NextResponse.json(
      { error: "Failed to create album" },
      { status: 500 }
    );
  }
}
