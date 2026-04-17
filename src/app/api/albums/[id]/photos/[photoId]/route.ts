import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteCachedImage } from "@/lib/image-cache";

interface RouteContext {
  params: Promise<{ id: string; photoId: string }>;
}

// DELETE /api/albums/:id/photos/:photoId
export async function DELETE(req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, photoId } = await context.params;

  try {
    const photo = await prisma.photo.findFirst({
      where: { id: photoId, albumId: id },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Delete from database (no cached files to delete anymore)
    await prisma.photo.delete({ where: { id: photoId } });

    // If this was the cover image, clear it
    const album = await prisma.album.findUnique({ where: { id } });
    if (album?.coverImage?.includes(photoId)) {
      await prisma.album.update({
        where: { id },
        data: { coverImage: null },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete photo:", error);
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 }
    );
  }
}
