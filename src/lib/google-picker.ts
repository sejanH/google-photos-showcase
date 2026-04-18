/**
 * Google Photos Picker API wrapper.
 *
 * The Picker API works in 3 steps:
 * 1. Create a session → get pickerUri
 * 2. User selects photos at pickerUri
 * 3. Poll session → retrieve selected media items
 *
 * @see https://developers.google.com/photos/picker
 */

const PICKER_BASE_URL = "https://photospicker.googleapis.com/v1";
const PHOTOS_LIBRARY_BASE_URL = "https://photospicker.googleapis.com/v1";

export interface PickerSession {
  id: string;
  pickerUri: string;
  expireTime: string;
  mediaItemsSet: boolean;
}

export interface PickedMediaItem {
  id: string;
  baseUrl: string;
  mimeType: string;
  mediaFile: {
    baseUrl: string;
    mimeType: string;
    filename: string;
    mediaFileMetadata?: {
      width: number;
      height: number;
      cameraMake?: string;
      cameraModel?: string;
    };
  };
}

export interface ListMediaItemsResponse {
  mediaItems: PickedMediaItem[];
  nextPageToken?: string;
}

/**
 * Create a new Picker session.
 * Returns a pickerUri that should be opened for the user to select photos.
 */
export async function createPickerSession(
  accessToken: string
): Promise<PickerSession> {
  const res = await fetch(`${PICKER_BASE_URL}/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to create picker session: ${res.status} ${error}`);
  }

  return res.json();
}

/**
 * Poll a Picker session to check if the user has finished selecting.
 */
export async function getPickerSession(
  accessToken: string,
  sessionId: string
): Promise<PickerSession> {
  const res = await fetch(`${PICKER_BASE_URL}/sessions/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to get picker session: ${res.status} ${error}`);
  }

  return res.json();
}

/**
 * List all media items selected in a completed Picker session.
 */
export async function listPickedMediaItems(
  accessToken: string,
  sessionId: string,
  pageToken?: string
): Promise<ListMediaItemsResponse> {
  const params = new URLSearchParams({ sessionId });
  if (pageToken) params.set("pageToken", pageToken);

  const res = await fetch(`${PICKER_BASE_URL}/mediaItems?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to list media items: ${res.status} ${error}`);
  }

  return res.json();
}

/**
 * Delete a Picker session (cleanup after use).
 */
export async function deletePickerSession(
  accessToken: string,
  sessionId: string
): Promise<void> {
  await fetch(`${PICKER_BASE_URL}/sessions/${sessionId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

/**
 * Get a single media item by its ID.
 * Useful for refreshing an expired baseUrl.
 */
export async function getMediaItem(
  accessToken: string,
  mediaItemId: string
): Promise<PickedMediaItem> {
  const res = await fetch(`${PICKER_BASE_URL}/mediaItems/${mediaItemId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to get media item: ${res.status} ${error}`);
  }

  return res.json();
}

/**
 * Get multiple media items by their IDs in a single request using the
 * Photos Library API endpoint.
 * Note: API limit is 50 ids per request.
 */
export async function batchGetMediaItems(
  accessToken: string,
  mediaItemIds: string[]
): Promise<{ mediaItems: PickedMediaItem[] }> {
  if (mediaItemIds.length === 0) return { mediaItems: [] };

  // Picker API does not support batchGet. We use parallel individual get requests.
  const results = await Promise.allSettled(
    mediaItemIds.map((id) => getMediaItem(accessToken, id))
  );

  const mediaItems: PickedMediaItem[] = results
    .filter((res): res is PromiseFulfilledResult<PickedMediaItem> => res.status === "fulfilled")
    .map((res) => res.value);

  return { mediaItems };
}
