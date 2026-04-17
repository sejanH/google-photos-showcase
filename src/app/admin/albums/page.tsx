import { prisma } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";

export const metadata = { title: "Albums" };

export default async function AdminAlbumsPage() {
  const albums = await prisma.album.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { photos: true } },
    },
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Albums</h1>
          <p className={styles.subtitle}>
            Create and manage your photo albums.
          </p>
        </div>
        <Link href="/admin/albums/new" className="btn btn--primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Album
        </Link>
      </div>

      {albums.length === 0 ? (
        <div className={styles.emptyState}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <h3>No albums yet</h3>
          <p>Create your first album and start adding photos from Google Photos.</p>
          <Link href="/admin/albums/new" className="btn btn--primary btn--lg">
            Create Your First Album
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {albums.map((album) => (
            <Link
              key={album.id}
              href={`/admin/albums/${album.id}/edit`}
              className={styles.albumCard}
            >
              <div className={styles.cardImage}>
                {album.coverImage ? (
                  <Image
                    src={album.coverImage}
                    alt={album.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className={styles.coverImg}
                  />
                ) : (
                  <div className={styles.cardPlaceholder}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                )}
                <div className={styles.cardBadge}>
                  <span className={`badge ${album.isPublished ? "badge--success" : "badge--warning"}`}>
                    {album.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{album.title}</h3>
                <p className={styles.cardMeta}>
                  {album._count.photos} photo{album._count.photos !== 1 ? "s" : ""}
                  {" · "}
                  /{album.slug}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
