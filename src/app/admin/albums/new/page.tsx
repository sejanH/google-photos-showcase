"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default function NewAlbumPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string,
    };

    try {
      const res = await fetch("/api/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Failed to create album");
      }

      const result = await res.json();
      router.push(`/admin/albums/${result.data.id}/edit`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() => router.back()}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        <h1 className={styles.title}>New Album</h1>
        <p className={styles.subtitle}>
          Create a new album, then add photos from Google Photos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}

        <div className="field">
          <label htmlFor="album-title" className="label">Album Title</label>
          <input
            id="album-title"
            name="title"
            type="text"
            className="input"
            placeholder="e.g., Summer Vacation 2025"
            required
            onChange={(e) => {
              const slugInput = document.getElementById("album-slug") as HTMLInputElement;
              if (slugInput && !slugInput.dataset.modified) {
                slugInput.value = generateSlug(e.target.value);
              }
            }}
          />
        </div>

        <div className="field">
          <label htmlFor="album-slug" className="label">URL Slug</label>
          <input
            id="album-slug"
            name="slug"
            type="text"
            className="input"
            placeholder="e.g., summer-vacation-2025"
            required
            pattern="[a-z0-9-]+"
            title="Only lowercase letters, numbers, and hyphens"
            onChange={(e) => {
              e.target.dataset.modified = "true";
            }}
          />
          <small className={styles.hint}>
            This will be used in the URL: /albums/your-slug
          </small>
        </div>

        <div className="field">
          <label htmlFor="album-description" className="label">Description (optional)</label>
          <textarea
            id="album-description"
            name="description"
            className="input textarea"
            placeholder="A brief description of this album..."
            rows={3}
          />
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => router.back()}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? "Creating..." : "Create Album"}
          </button>
        </div>
      </form>
    </div>
  );
}
