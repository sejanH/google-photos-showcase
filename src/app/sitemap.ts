import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  try {
    // Public albums
    const albums = await prisma.album.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    });

    const albumEntries: MetadataRoute.Sitemap = albums.map((album) => ({
      url: `${baseUrl}/albums/${album.slug}`,
      lastModified: album.updatedAt,
      changeFrequency: "monthly",
      priority: 0.8,
    }));

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1,
      },
      ...albumEntries,
    ];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1,
      },
    ];
  }
}
