import { prisma } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";

export default async function AdminDashboard() {
  const [albums, totalPhotos, publishedCount, draftCount] = await Promise.all([
    prisma.album.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        _count: { select: { photos: true } },
      },
    }),
    prisma.photo.count(),
    prisma.album.count({ where: { isPublished: true } }),
    prisma.album.count({ where: { isPublished: false } }),
  ]);

  const totalAlbums = publishedCount + draftCount;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>
            Manage your photo showcase from here.
          </p>
        </div>
        <Link href="/admin/albums/new" className="btn btn--primary">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Album
        </Link>
      </div>

      {/* Stats Cards */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} data-color="accent">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{totalAlbums}</span>
            <span className={styles.statLabel}>Total Albums</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} data-color="success">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{publishedCount}</span>
            <span className={styles.statLabel}>Published</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} data-color="warning">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{draftCount}</span>
            <span className={styles.statLabel}>Drafts</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} data-color="info">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-3l-2.5-3z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{totalPhotos}</span>
            <span className={styles.statLabel}>Total Photos</span>
          </div>
        </div>
      </div>

      {/* Recent Albums */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Albums</h2>
          <Link href="/admin/albums" className={styles.sectionLink}>
            View All →
          </Link>
        </div>

        {albums.length === 0 ? (
          <div className={styles.emptyState}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <h3>No albums yet</h3>
            <p>Create your first album to get started.</p>
            <Link href="/admin/albums/new" className="btn btn--primary">
              Create Album
            </Link>
          </div>
        ) : (
          <div className={styles.albumList}>
            {albums.map((album) => (
              <Link
                key={album.id}
                href={`/admin/albums/${album.id}/edit`}
                className={styles.albumItem}
              >
                <div className={styles.albumThumb}>
                  {album.coverImage ? (
                    <Image
                      src={album.coverImage}
                      alt={album.title}
                      width={56}
                      height={56}
                      className={styles.albumImage}
                    />
                  ) : (
                    <div className={styles.albumPlaceholder}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className={styles.albumInfo}>
                  <span className={styles.albumTitle}>{album.title}</span>
                  <span className={styles.albumMeta}>
                    {album._count.photos} photo{album._count.photos !== 1 ? "s" : ""}
                    {" · "}
                    {album.updatedAt.toLocaleDateString()}
                  </span>
                </div>
                <span
                  className={`badge ${
                    album.isPublished ? "badge--success" : "badge--warning"
                  }`}
                >
                  {album.isPublished ? "Published" : "Draft"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
