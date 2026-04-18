"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import styles from "./page.module.css";

interface Photo {
  id: string;
  caption: string | null;
  sortOrder: number;
}

interface Album {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  isPublished: boolean;
  photos: Photo[];
}

export default function EditAlbumPage() {
  const router = useRouter();
  const params = useParams();
  const albumId = params.id as string;

  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchAlbum = useCallback(async () => {
    try {
      const res = await fetch(`/api/albums/${albumId}`);
      if (!res.ok) throw new Error("Failed to fetch album");
      const result = await res.json();
      setAlbum(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch album");
    } finally {
      setLoading(false);
    }
  }, [albumId]);

  useEffect(() => {
    fetchAlbum();
  }, [fetchAlbum]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string,
      isPublished: formData.get("isPublished") === "on",
    };

    try {
      const res = await fetch(`/api/albums/${albumId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Failed to save");
      }

      setSuccess("Album saved successfully!");
      fetchAlbum();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch album");
    } finally {
      setSaving(false);
    }
  }

  async function handlePickPhotos() {
    setPicking(true);
    setError("");

    try {
      // 1. Create a Picker session
      const sessionRes = await fetch("/api/picker/session", {
        method: "POST",
      });

      if (!sessionRes.ok) {
        const result = await sessionRes.json();

        // Check if re-authentication is required
        if (result.requiresReauth) {
          setError(result.message || "Session expired. Redirecting to login...");
          setTimeout(() => {
            router.push("/admin/login?reauth=true");
          }, 1500);
          return;
        }

        throw new Error(result.error || "Failed to create picker session");
      }

      const { data: session } = await sessionRes.json();

      // 2. Open the Picker URI in a new window
      const pickerWindow = window.open(
        session.pickerUri,
        "google-photos-picker",
        "width=1000,height=700,scrollbars=yes"
      );

      // 3. Poll for completion
      setPolling(true);
      const pollInterval = setInterval(async () => {
        try {
          const pollRes = await fetch(
            `/api/picker/session?sessionId=${session.id}`
          );
          const pollResult = await pollRes.json();

          // Check if re-authentication is required
          if (pollResult.requiresReauth) {
            clearInterval(pollInterval);
            setPolling(false);
            if (pickerWindow && !pickerWindow.closed) {
              pickerWindow.close();
            }
            setError(pollResult.message || "Session expired. Redirecting to login...");
            setTimeout(() => {
              router.push("/admin/login?reauth=true");
            }, 1500);
            return;
          }

          if (pollResult.data?.mediaItemsSet) {
            clearInterval(pollInterval);
            setPolling(false);

            // 4. Download the selected photos
            const downloadRes = await fetch("/api/picker/download", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId: session.id,
                albumId,
              }),
            });

            if (!downloadRes.ok) {
              const downloadResult = await downloadRes.json();

              // Check if re-authentication is required
              if (downloadResult.requiresReauth) {
                clearInterval(pollInterval);
                setPolling(false);
                if (pickerWindow && !pickerWindow.closed) {
                  pickerWindow.close();
                }
                setError(downloadResult.message || "Session expired. Redirecting to login...");
                setTimeout(() => {
                  router.push("/admin/login?reauth=true");
                }, 1500);
                return;
              }

              throw new Error(
                downloadResult.error || "Failed to download photos"
              );
            }

            const downloadResult = await downloadRes.json();
            setSuccess(
              `Successfully added ${downloadResult.data.count} photo(s)!`
            );
            fetchAlbum();
            setTimeout(() => setSuccess(""), 5000);

            if (pickerWindow && !pickerWindow.closed) {
              pickerWindow.close();
            }
          }
        } catch (err) {
          clearInterval(pollInterval);
          setPolling(false);
          setError(err instanceof Error ? err.message : "Polling failed");
        }
      }, 2000);

      // Clean up if the picker window is closed manually
      const windowCheck = setInterval(() => {
        if (pickerWindow && pickerWindow.closed && polling) {
          clearInterval(windowCheck);
          // Give a few more seconds for the final poll
          setTimeout(() => {
            clearInterval(pollInterval);
            setPolling(false);
            setPicking(false);
          }, 5000);
        }
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch album");
    } finally {
      setPicking(false);
    }
  }

  async function handleDeletePhoto(photoId: string) {
    if (!confirm("Remove this photo from the album?")) return;

    try {
      const res = await fetch(`/api/albums/${albumId}/photos/${photoId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete photo");
      fetchAlbum();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch album");
    }
  }

  async function handleSetCover(photoId: string) {
    const photoPath = `/api/media/${photoId}?w=800&h=500&c=true`;
    try {
      const res = await fetch(`/api/albums/${albumId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverImage: photoPath }),
      });

      if (!res.ok) throw new Error("Failed to set cover image");
      setSuccess("Cover image updated!");
      fetchAlbum();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch album");
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        "Are you sure you want to delete this album? This cannot be undone."
      )
    )
      return;

    try {
      const res = await fetch(`/api/albums/${albumId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete album");
      router.push("/admin/albums");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch album");
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className="skeleton" style={{ width: 200, height: 32 }} />
          <div className="skeleton" style={{ width: 300, height: 16, marginTop: 8 }} />
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>Album not found</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push("/admin/albums")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Albums
        </button>
        <h1 className={styles.title}>Edit Album</h1>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}
      {success && <div className={styles.successBanner}>{success}</div>}

      {/* Album Details Form */}
      <form onSubmit={handleSave} className={styles.section}>
        <h2 className={styles.sectionTitle}>Album Details</h2>

        <div className="field">
          <label htmlFor="edit-title" className="label">Title</label>
          <input
            id="edit-title"
            name="title"
            type="text"
            className="input"
            defaultValue={album.title}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="edit-slug" className="label">Slug</label>
          <input
            id="edit-slug"
            name="slug"
            type="text"
            className="input"
            defaultValue={album.slug}
            required
            pattern="[a-z0-9-]+"
          />
        </div>

        <div className="field">
          <label htmlFor="edit-description" className="label">Description</label>
          <textarea
            id="edit-description"
            name="description"
            className="input textarea"
            defaultValue={album.description || ""}
            rows={3}
          />
        </div>

        <div className={styles.toggleField}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              name="isPublished"
              defaultChecked={album.isPublished}
              className={styles.toggleInput}
            />
            <span className={styles.toggleSwitch} />
            <span className={styles.toggleLabel}>
              {album.isPublished ? "Published" : "Draft"}
            </span>
          </label>
          <span className={styles.toggleHint}>
            Published albums are visible to everyone.
          </span>
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            className="btn btn--danger btn--sm"
            onClick={handleDelete}
          >
            Delete Album
          </button>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      {/* Photos Section */}
      <div className={styles.section}>
        <div className={styles.photosHeader}>
          <h2 className={styles.sectionTitle}>
            Photos ({album.photos.length})
          </h2>
          <button
            className="btn btn--primary"
            onClick={handlePickPhotos}
            disabled={picking || polling}
          >
            {polling ? (
              <>
                <span className={styles.spinner} />
                Waiting for selection...
              </>
            ) : picking ? (
              "Opening Picker..."
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add from Google Photos
              </>
            )}
          </button>
        </div>

        {album.photos.length === 0 ? (
          <div className={styles.photosEmpty}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-3l-2.5-3z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
            <p>No photos yet. Click &ldquo;Add from Google Photos&rdquo; to get started.</p>
          </div>
        ) : (
          <div className={styles.photosGrid}>
            {album.photos.map((photo) => (
              <div key={photo.id} className={styles.photoCard}>
                <div className={styles.photoImage}>
                  <Image
                    src={`/api/media/${photo.id}?w=300&h=300&c=true`}
                    alt={photo.caption || "Photo"}
                    fill
                    sizes="200px"
                    className={styles.photoImg}
                  />
                </div>
                <div className={styles.photoActions}>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={() => handleSetCover(photo.id)}
                    title="Set as cover image"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={() => handleDeletePhoto(photo.id)}
                    title="Remove photo"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
                {album.coverImage?.includes(photo.id) && (
                  <div className={styles.coverBadge}>Cover</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
