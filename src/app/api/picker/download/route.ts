import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  listPickedMediaItems,
  deletePickerSession,
} from "@/lib/google-picker";
import { getAdminAccessToken } from "@/lib/media-service";

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
    const userId = (session.user as { id?: string | null } | undefined)?.id;
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


    // Get a fresh access token
    let accessToken: string;
    try {
      accessToken = await getAdminAccessToken(userId ?? undefined);
    } catch (tokenError) {
      console.error("Failed to get access token:", tokenError);
      const errorMessage = tokenError instanceof Error ? tokenError.message : String(tokenError);
      const isTokenError =
        errorMessage.includes("expired") ||
        errorMessage.includes("revoked") ||
        errorMessage.includes("invalid_grant") ||
        errorMessage.includes("Failed to refresh access token");

      if (isTokenError) {
        return NextResponse.json(
          {
            error: "Session expired",
            requiresReauth: true,
            message: "Your Google session has expired. Please sign in again.",
            reason: errorMessage.slice(0, 220),
          },
          { status: 401 }
        );
      }

      throw tokenError;
    }

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
