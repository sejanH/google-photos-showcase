import { prisma } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

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
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.titleGroup}>
          <p className={styles.greeting}>{getGreeting()} 👋</p>
          <h1 className={styles.title}>Dashboard</h1>
        </div>
        <Link href="/admin/albums/new" className="btn btn--primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Album
        </Link>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard} data-type="albums">
          <div className={styles.statTop}>
            <div className={styles.statIcon} data-color="accent">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <span className={styles.statBadge}>All</span>
          </div>
          <div className={styles.statValue}>{totalAlbums}</div>
          <div className={styles.statLabel}>Total Albums</div>
        </div>

        <div className={styles.statCard} data-type="published">
          <div className={styles.statTop}>
            <div className={styles.statIcon} data-color="success">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <span className={styles.statBadge}>Live</span>
          </div>
          <div className={styles.statValue}>{publishedCount}</div>
          <div className={styles.statLabel}>Published</div>
        </div>

        <div className={styles.statCard} data-type="drafts">
          <div className={styles.statTop}>
            <div className={styles.statIcon} data-color="warning">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <span className={styles.statBadge}>Hidden</span>
          </div>
          <div className={styles.statValue}>{draftCount}</div>
          <div className={styles.statLabel}>Drafts</div>
        </div>

        <div className={styles.statCard} data-type="photos">
          <div className={styles.statTop}>
            <div className={styles.statIcon} data-color="info">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </div>
            <span className={styles.statBadge}>Total</span>
          </div>
          <div className={styles.statValue}>{totalPhotos}</div>
          <div className={styles.statLabel}>Total Photos</div>
        </div>
      </div>

      {/* Content Grid */}
      <div className={styles.contentGrid}>
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
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <h3>No albums yet</h3>
              <p>Create your first album to get started.</p>
              <Link href="/admin/albums/new" className="btn btn--primary btn--sm">
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
                        width={52}
                        height={52}
                        className={styles.albumImage}
                      />
                    ) : (
                      <div className={styles.albumPlaceholder}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
                      {album.updatedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <span className={`badge ${album.isPublished ? "badge--success" : "badge--warning"}`}>
                    {album.isPublished ? "Published" : "Draft"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Quick Actions</h2>
          </div>
          <div className={styles.quickActions}>
            <Link href="/admin/albums/new" className={styles.quickAction}>
              <div className={styles.quickActionIcon} data-color="accent">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <div className={styles.quickActionText}>
                <span className={styles.quickActionTitle}>New Album</span>
                <span className={styles.quickActionDesc}>Create a new photo collection</span>
              </div>
              <div className={styles.quickActionArrow}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Link>

            <Link href="/admin/albums" className={styles.quickAction}>
              <div className={styles.quickActionIcon} data-color="success">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <div className={styles.quickActionText}>
                <span className={styles.quickActionTitle}>Manage Albums</span>
                <span className={styles.quickActionDesc}>Edit, publish, or delete albums</span>
              </div>
              <div className={styles.quickActionArrow}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Link>

            <Link href="/admin/settings" className={styles.quickAction}>
              <div className={styles.quickActionIcon} data-color="info">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
              </div>
              <div className={styles.quickActionText}>
                <span className={styles.quickActionTitle}>Site Settings</span>
                <span className={styles.quickActionDesc}>Configure your showcase</span>
              </div>
              <div className={styles.quickActionArrow}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Link>

            <Link href="/" target="_blank" className={styles.quickAction}>
              <div className={styles.quickActionIcon} data-color="accent">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </div>
              <div className={styles.quickActionText}>
                <span className={styles.quickActionTitle}>View Live Site</span>
                <span className={styles.quickActionDesc}>See your public gallery</span>
              </div>
              <div className={styles.quickActionArrow}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
