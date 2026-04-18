import { prisma } from "./db";
import { batchGetMediaItems } from "./google-picker";

/**
 * Service to handle media item refreshing logic.
 */
export async function refreshBaseUrls(photoIds?: string[]) {
  // Get the admin account to use for refreshing
  // We assume the first account with provider 'google' is the admin
  const account = await prisma.account.findFirst({
    where: { provider: "google", refresh_token: { not: null } },
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

  // 3. Batch refresh in chunks of 50 (Photos Library API limit)
  const CHUNK_SIZE = 50;
  let refreshedCount = 0;

  for (let i = 0; i < photos.length; i += CHUNK_SIZE) {
    const chunk = photos.slice(i, i + CHUNK_SIZE);
    const googleIds = chunk.map((p) => p.googleMediaId);
    const expiryDate = new Date(Date.now() + 55 * 60 * 1000); // 55 mins from now

    try {
      const { mediaItems } = await batchGetMediaItems(access_token, googleIds);

      await Promise.all(
        mediaItems.map(async (item) => {
          const baseUrl = item.mediaFile?.baseUrl || item.baseUrl;
          if (!baseUrl) return;
          await prisma.photo.update({
            where: { googleMediaId: item.id },
            data: {
              baseUrl,
              baseUrlExpiresAt: expiryDate,
            },
          });
          refreshedCount++;
        })
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const scopeInsufficient =
        message.includes("ACCESS_TOKEN_SCOPE_INSUFFICIENT") ||
        message.includes("insufficient authentication scopes");

      if (!scopeInsufficient) {
        throw error;
      }

      throw new Error(
        "Google Photos Library scope is missing for this account. " +
        "Please re-authenticate to grant photoslibrary.readonly, then retry refresh."
      );
    }
  }

  return refreshedCount;
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
  const account = userId
    ? await prisma.account.findFirst({
        where: { userId, provider: "google" },
      })
    : await prisma.account.findFirst({
        where: { provider: "google", refresh_token: { not: null } },
      });

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
