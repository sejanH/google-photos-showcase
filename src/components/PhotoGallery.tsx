"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./PhotoGallery.module.css";
import Lightbox from "./Lightbox";

interface Photo {
  id: string;
  width: number | null;
  height: number | null;
  caption: string | null;
}

interface PhotoGalleryProps {
  photos: Photo[];
  albumTitle: string;
}

export default function PhotoGallery({ photos, albumTitle }: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No photos in this album yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.gallery}>
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            className={styles.item}
            onClick={() => setLightboxIndex(index)}
            style={{ animationDelay: `${index * 50}ms` }}
            aria-label={photo.caption || `Photo ${index + 1} from ${albumTitle}`}
          >
            <Image
              src={`/api/media/${photo.id}?w=600&h=600&c=true`}
              alt={photo.caption || `Photo ${index + 1}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={styles.image}
              loading={index < 8 ? "eager" : "lazy"}
            />
            <div className={styles.hoverOverlay}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h6v6M14 10l6.1-6.1M9 21H3v-6M10 14l-6.1 6.1" />
              </svg>
            </div>
            {photo.caption && (
              <div className={styles.caption}>{photo.caption}</div>
            )}
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
