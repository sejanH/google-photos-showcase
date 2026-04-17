import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  listPickedMediaItems,
  deletePickerSession,
} from "@/lib/google-picker";

interface GoogleMediaItem {
  id: string;
  baseUrl?: string;
  mimeType?: string;
  mediaFile?: {
    baseUrl?: string;
    mimeType?: string;
    mediaFileMetadata?: {
      width?: number;
      height?: number;
    };
  };
}

// POST /api/picker/download — Download selected photos from a completed session
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { sessionId, albumId } = body;

    if (!sessionId || !albumId) {
      return NextResponse.json(
        { error: "sessionId and albumId are required" },
        { status: 400 }
      );
    }

    // Verify album exists
    const album = await prisma.album.findUnique({ where: { id: albumId } });
    if (!album) {
      return NextResponse.json(
        { error: "Album not found" },
        { status: 404 }
      );
    }

    // Get user's access token
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

    const accessToken = account.access_token;

    // Fetch all media items (with pagination)
    let allItems: GoogleMediaItem[] = [];
    let pageToken: string | undefined;

    do {
      const result = await listPickedMediaItems(
        accessToken,
        sessionId,
        pageToken
      );
      if (result.mediaItems) {
        allItems = [...allItems, ...result.mediaItems];
      }
      pageToken = result.nextPageToken;
    } while (pageToken);

    // Get current max sort order
    const maxSortOrder = await prisma.photo.aggregate({
      where: { albumId },
      _max: { sortOrder: true },
    });
    let sortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;

    // Store each photo in DB
    let processedCount = 0;
    const errors: string[] = [];
    const expiryDate = new Date(Date.now() + 55 * 60 * 1000);

    for (const item of allItems) {
      try {
        const baseUrl = item.mediaFile?.baseUrl || item.baseUrl;
        const mimeType = item.mediaFile?.mimeType || item.mimeType;
        const width = item.mediaFile?.mediaFileMetadata?.width || null;
        const height = item.mediaFile?.mediaFileMetadata?.height || null;

        if (!baseUrl) {
          errors.push(`No baseUrl for item ${item.id}`);
          continue;
        }

        // Save to database (NO DOWNLOAD)
        const photo = await prisma.photo.create({
          data: {
            googleMediaId: item.id,
            baseUrl,
            baseUrlExpiresAt: expiryDate,
            width,
            height,
            mimeType,
            sortOrder: sortOrder++,
            albumId,
          },
        });

        processedCount++;

        // Set as cover if album has no cover yet
        if (!album.coverImage && processedCount === 1) {
          await prisma.album.update({
            where: { id: albumId },
            data: { coverImage: `/api/media/${photo.id}?w=800&h=500&c=true` },
          });
        }
      } catch (err) {
        console.error(`Failed to process item ${item.id}:`, err);
        errors.push(`Failed to process: ${item.id}`);
      }
    }

    // Clean up the picker session
    try {
      await deletePickerSession(accessToken, sessionId);
    } catch {
      // Non-critical
    }

    return NextResponse.json({
      success: true,
      data: {
        count: processedCount,
        total: allItems.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error("Failed to download photos:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to download photos" },
      { status: 500 }
    );
  }
}
