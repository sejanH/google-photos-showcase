import { prisma } from "./db";
import { batchGetMediaItems } from "./google-picker";
import fs from "fs";
import path from "path";
import { pipeline } from "stream";
import { promisify } from "util";

const streamPipeline = promisify(pipeline);
const STORAGE_DIR = path.join(process.cwd(), "storage", "media");

async function findPreferredGoogleAccount(userId?: string) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const requiredScope = "photospicker.mediaitems.readonly";

  if (userId) {
    const scopedAccount = await prisma.account.findFirst({
      where: {
        userId,
        provider: "google",
        refresh_token: { not: null },
        scope: { contains: requiredScope },
      },
    });
    if (scopedAccount) return scopedAccount;

    return prisma.account.findFirst({
      where: { userId, provider: "google" },
    });
  }

  if (adminEmail) {
    const adminScopedAccount = await prisma.account.findFirst({
      where: {
        provider: "google",
        refresh_token: { not: null },
        scope: { contains: requiredScope },
        user: { email: adminEmail },
      },
    });
    if (adminScopedAccount) return adminScopedAccount;

    const adminAccount = await prisma.account.findFirst({
      where: {
        provider: "google",
        refresh_token: { not: null },
        user: { email: adminEmail },
      },
    });
    if (adminAccount) return adminAccount;
  }

  return prisma.account.findFirst({
    where: {
      provider: "google",
      refresh_token: { not: null },
      scope: { contains: requiredScope },
    },
  }).then((scoped) =>
    scoped ??
    prisma.account.findFirst({
      where: { provider: "google", refresh_token: { not: null } },
    })
  );
}

/**
 * Service to handle media item downloading (formerly refreshing logic).
 * Finds photos without a local storagePath whose baseUrl is still valid and downloads them.
 */
export async function refreshBaseUrls(photoIds?: string[]) {
  const now = new Date();
  
  // Find photos that haven't been downloaded yet AND whose baseUrl hasn't expired
  const photos = await prisma.photo.findMany({
    where: {
      ...(photoIds ? { id: { in: photoIds } } : {}),
      storagePath: null,
      baseUrlExpiresAt: { gt: now }
    },
    select: { id: true },
  });

  if (photos.length === 0) return 0;

  let downloadedCount = 0;

  for (const photo of photos) {
    try {
      await downloadAndCachePhoto(photo.id);
      downloadedCount++;
    } catch (error) {
      console.error(`Failed to download photo ${photo.id}:`, error);
    }
  }

  return downloadedCount;
}

/**
 * Downloads a photo from Google and saves it to local storage.
 */
export async function downloadAndCachePhoto(photoId: string) {
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
  });

  if (!photo) throw new Error("Photo not found in database");
  if (photo.storagePath && fs.existsSync(photo.storagePath)) {
    return photo.storagePath;
  }

  // Ensure storage directory exists
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }

  const response = await fetch(photo.baseUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image from Google: ${response.statusText}`);
  }

  const extension = photo.mimeType?.split("/")[1] || "jpg";
  const fileName = `${photo.id}.${extension}`;
  const filePath = path.join(STORAGE_DIR, fileName);

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(filePath, buffer);

  await prisma.photo.update({
    where: { id: photoId },
    data: { storagePath: filePath },
  });

  return filePath;
}

/**
 * Get a fresh access token for the admin.
 */
export async function getAdminAccessToken(userId?: string) {
  return getGoogleAccessToken(userId);
}

/**
 * Get a fresh access token for a specific Google-authenticated user.
 * Falls back to current access token if still valid, otherwise refreshes.
 */
export async function getGoogleAccessToken(userId?: string) {
  const account = await findPreferredGoogleAccount(userId);

  if (!account) {
    throw new Error("No Google account found. Please log in with Google first.");
  }

  const now = Math.floor(Date.now() / 1000);
  const hasValidAccessToken =
    Boolean(account.access_token) &&
    (!account.expires_at || account.expires_at > now + 60);

  if (hasValidAccessToken && account.access_token) {
    return account.access_token;
  }

  if (!account.refresh_token) {
    throw new Error("No refresh token available for this Google account. Please sign in again.");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: account.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Token refresh failed:", res.status, errorText);
    throw new Error(`Failed to refresh access token: ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  const accessToken = data.access_token as string | undefined;

  if (!accessToken) {
    throw new Error("Google token response did not include access_token.");
  }

  const nextExpiresAt =
    typeof data.expires_in === "number" ? Math.floor(Date.now() / 1000) + data.expires_in : null;
  const nextRefreshToken = typeof data.refresh_token === "string" ? data.refresh_token : null;

  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: accessToken,
      expires_at: nextExpiresAt ?? account.expires_at,
      refresh_token: nextRefreshToken ?? account.refresh_token,
    },
  });

  return accessToken;
}
