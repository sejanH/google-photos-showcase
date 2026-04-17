// ─── Auth Types ─────────────────────────────────────────

export interface SessionWithToken {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  accessToken?: string;
  expires: string;
}

// ─── Album Types ────────────────────────────────────────

export interface AlbumWithPhotos {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  isPublished: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  photos: PhotoData[];
}

export interface PhotoData {
  id: string;
  googleMediaId: string | null;
  cachedPath: string;
  thumbnailPath: string | null;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  caption: string | null;
  sortOrder: number;
  createdAt: Date;
}

// ─── Site Settings ──────────────────────────────────────

export interface SiteSettingsData {
  id: string;
  siteName: string;
  siteTagline: string | null;
  heroImage: string | null;
  ownerName: string | null;
  socialLinks: SocialLinks | null;
}

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  website?: string;
  github?: string;
  flickr?: string;
}

// ─── API Response Types ─────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
