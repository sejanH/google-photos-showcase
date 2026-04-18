import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PhotoGallery from "@/components/PhotoGallery";
import styles from "./page.module.css";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const album = await prisma.album.findUnique({
      where: { slug, isPublished: true },
    });

    if (!album) return { title: "Album Not Found" };

    return {
      title: album.title,
      description: album.description || `View the "${album.title}" photo album`,
      openGraph: {
        title: album.title,
        description: album.description || `View the "${album.title}" photo album`,
        ...(album.coverImage ? { images: [album.coverImage] } : {}),
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return { title: "Photo Album" };
  }
}

export async function generateStaticParams() {
  try {
    const albums = await prisma.album.findMany({
      where: { isPublished: true },
      select: { slug: true },
    });

    return albums.map((album) => ({ slug: album.slug }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

export const dynamicParams = true;

export default async function AlbumPage({ params }: PageProps) {
  const { slug } = await params;

  const album = await prisma.album.findUnique({
    where: { slug, isPublished: true },
    include: {
      photos: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!album) notFound();

  const settings = await prisma.siteSettings.findFirst({
    where: { id: "default" },
  });

  const siteName = settings?.siteName || "Photo Showcase";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    "name": album.title,
    "description": album.description,
    "image": album.photos.slice(0, 5).map(p => `/api/media/${p.id}?w=1200`),
    "author": {
      "@type": "Person",
      "name": settings?.ownerName || siteName
    }
  };

  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar siteName={siteName} />

      <main className={styles.main}>
        {/* Album Header */}
        <section className={styles.header}>
          <div className="container">
            <Link href="/" className={styles.backLink}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to Albums
            </Link>
            <h1 className={styles.title}>{album.title}</h1>
            {album.description && (
              <p className={styles.description}>{album.description}</p>
            )}
            <div className={styles.meta}>
              <span className={styles.photoCount}>
                {album.photos.length} photo{album.photos.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </section>

        {/* Photo Gallery */}
        <section className={styles.gallery}>
          <div className="container container--wide">
            <PhotoGallery photos={album.photos} albumTitle={album.title} />
          </div>
        </section>
      </main>

      <Footer siteName={siteName} ownerName={settings?.ownerName || undefined} />
    </div>
  );
}
