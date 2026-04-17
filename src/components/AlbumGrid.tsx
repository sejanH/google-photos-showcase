import Link from "next/link";
import Image from "next/image";
import styles from "./AlbumGrid.module.css";

interface Album {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  _count?: { photos: number };
}

interface AlbumGridProps {
  albums: Album[];
}

export default function AlbumGrid({ albums }: AlbumGridProps) {
  if (albums.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
        <h3 className={styles.emptyTitle}>No albums yet</h3>
        <p className={styles.emptyText}>
          Albums will appear here once they are published.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {albums.map((album, index) => (
        <Link
          key={album.id}
          href={`/albums/${album.slug}`}
          className={styles.card}
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <div className={styles.imageWrapper}>
            {album.coverImage ? (
              <Image
                src={album.coverImage}
                alt={album.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className={styles.image}
              />
            ) : (
              <div className={styles.placeholder}>
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            )}
            <div className={styles.overlay}>
              <span className={styles.viewBtn}>View Album →</span>
            </div>
          </div>
          <div className={styles.info}>
            <h3 className={styles.title}>{album.title}</h3>
            {album.description && (
              <p className={styles.description}>{album.description}</p>
            )}
            {album._count && (
              <span className={styles.count}>
                {album._count.photos} photo{album._count.photos !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
