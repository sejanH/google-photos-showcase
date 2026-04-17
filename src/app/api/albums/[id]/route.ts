import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/albums/:id
export async function GET(req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const album = await prisma.album.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!album) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: album });
}

// PATCH /api/albums/:id
export async function PATCH(req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const body = await req.json();
    const { title, slug, description, isPublished, coverImage } = body;

    // If slug is being changed, check uniqueness
    if (slug) {
      const existing = await prisma.album.findFirst({
        where: { slug, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: "An album with this slug already exists" },
          { status: 409 }
        );
      }
    }

    const album = await prisma.album.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && {
          slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        }),
        ...(description !== undefined && { description: description || null }),
        ...(isPublished !== undefined && { isPublished }),
        ...(coverImage !== undefined && { coverImage }),
      },
    });

    return NextResponse.json({ success: true, data: album });
  } catch (error) {
    console.error("Failed to update album:", error);
    return NextResponse.json(
      { error: "Failed to update album" },
      { status: 500 }
    );
  }
}

// DELETE /api/albums/:id
export async function DELETE(req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    // Delete album (photos cascade in DB, no local files)
    await prisma.album.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete album:", error);
    return NextResponse.json(
      { error: "Failed to delete album" },
      { status: 500 }
    );
  }
}
