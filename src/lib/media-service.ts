import { prisma } from "./db";
import { batchGetMediaItems } from "./google-picker";

/**
 * Service to handle media item refreshing logic.
 */
export async function refreshBaseUrls(photoIds?: string[]) {
  // Get the admin account to use for refreshing
  // We assume the first account with provider 'google' is the admin
  const account = await prisma.account.findFirst({
    where: { provider: "google" },
  });

  if (!account) {
    throw new Error("No Google account found. Please log in with Google first.");
  }

  if (!account.refresh_token) {
    throw new Error(
      "No refresh token found. This usually means you logged in before offline access was enabled. " +
      "Please log out and log in again to get a refresh token."
    );
  }

  // 1. Refresh the access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: account.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text();
    console.error("Token refresh failed:", tokenRes.status, errorText);
    throw new Error(`Failed to refresh access token: ${tokenRes.status} - ${errorText}`);
  }

  const { access_token } = await tokenRes.json();

  // 2. Fetch photos that need refreshing
  // If no photoIds provided, refresh all that are close to expiring (or all for simplicity in a cron)
  const photos = await prisma.photo.findMany({
    where: photoIds ? { id: { in: photoIds } } : {},
    select: { id: true, googleMediaId: true },
  });

  if (photos.length === 0) return 0;

  // 3. Batch refresh in chunks of 100 (Google limit)
  const CHUNK_SIZE = 100;
  let refreshedCount = 0;

  for (let i = 0; i < photos.length; i += CHUNK_SIZE) {
    const chunk = photos.slice(i, i + CHUNK_SIZE);
    const googleIds = chunk.map((p) => p.googleMediaId);

    const { mediaItems } = await batchGetMediaItems(access_token, googleIds);

    // 4. Update database
    const expiryDate = new Date(Date.now() + 55 * 60 * 1000); // 55 mins from now

    await Promise.all(
      mediaItems.map(async (item) => {
        const baseUrl = item.mediaFile?.baseUrl || item.baseUrl;
        if (baseUrl) {
          await prisma.photo.update({
            where: { googleMediaId: item.id },
            data: {
              baseUrl,
              baseUrlExpiresAt: expiryDate,
            },
          });
          refreshedCount++;
        }
      })
    );
  }

  return refreshedCount;
}

/**
 * Get a fresh access token for the admin.
 */
export async function getAdminAccessToken() {
  const account = await prisma.account.findFirst({
    where: { provider: "google" },
  });

  if (!account) {
    throw new Error("No Google account found. Please log in with Google first.");
  }

  if (!account.refresh_token) {
    throw new Error(
      "No refresh token found. This usually means you logged in before offline access was enabled. " +
      "Please log out and log in again to get a refresh token."
    );
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
  return data.access_token as string;
}
