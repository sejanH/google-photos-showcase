import { prisma } from "@/lib/db";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AlbumGrid from "@/components/AlbumGrid";
import styles from "./page.module.css";

export default async function HomePage() {
  const [albums, settings] = await Promise.all([
    prisma.album.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { photos: true } },
      },
    }),
    prisma.siteSettings.findFirst({ where: { id: "default" } }),
  ]);

  const siteName = settings?.siteName || process.env.SITE_NAME || "Photo Showcase";
  const tagline = settings?.siteTagline || "A curated collection of moments";

  return (
    <div className={styles.page}>
      <Navbar siteName={siteName} />

      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroGlow} />
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>{siteName}</h1>
            <p className={styles.heroTagline}>{tagline}</p>
            <div className={styles.heroDivider} />
          </div>
        </section>

        {/* Albums Section */}
        <section className={styles.albums}>
          <div className="container container--wide">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Albums</h2>
              <p className={styles.sectionSubtitle}>
                Browse through curated photo collections
              </p>
            </div>
            <AlbumGrid albums={albums} />
          </div>
        </section>
      </main>

      <Footer siteName={siteName} ownerName={settings?.ownerName || undefined} />
    </div>
  );
}
