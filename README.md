# 📸 Google Photos Showcase

A beautiful, open-source photo gallery website that connects to your **Google Photos** library. Curate albums through the Google Photos Picker and display them in a stunning public gallery — no manual uploads, no duplicate storage.

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Prisma](https://img.shields.io/badge/Prisma-SQLite-green)

---

## ✨ Features

- **Google Photos Picker Integration** — Select photos directly from your Google Photos library
- **Zero Local Storage** — Images are served directly from Google via a secure proxy (no disk space used)
- **Auto-Refreshing Links** — Built-in cron job and auto-refresh logic to handle Google's 60-minute expiry
- **Beautiful Public Gallery** — Responsive album grid with lightbox viewer
- **Admin Dashboard** — Manage albums, photos, and site settings
- **Dark Mode Design** — Premium dark theme with smooth animations
- **SEO Optimized** — Dynamic meta tags, Open Graph, structured data
- **Self-Hosted** — Run on any Node.js server or Docker
- **Open Source** — Apache 2.0 license, contributions welcome

## 🖼️ How It Works

1. **Sign in** to the admin dashboard with your Google account
2. **Create an album** with a title and description
3. **Pick photos** from Google Photos using the secure Picker flow
4. Photos are **proxied** through your server (to add the required Auth headers)
5. A **Cron job** (or auto-refresh logic) keeps the Google URIs fresh every 55 minutes
6. **Publish** the album — it instantly appears on your public gallery

> **Note:** The Google Photos Picker API (post-March 2025) requires a manual selection flow. There is no automatic sync — you pick photos each time you want to add them.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+
- A **Google Cloud** project (free)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/google-photos-showcase.git
cd google-photos-showcase
npm install
```

### 2. Set Up Google Cloud

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → Enable the **Google Photos Picker API**
3. Go to **APIs & Services → OAuth consent screen** → configure
4. Go to **APIs & Services → Credentials** → Create **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy the **Client ID** and **Client Secret**

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=run-openssl-rand-base64-32
ADMIN_EMAIL=your-email@gmail.com
DATABASE_URL="file:./prisma/dev.db"
```

> Generate `NEXTAUTH_SECRET` with: `openssl rand -base64 32`

### 4. Set Up Database

```bash
npx prisma db push
```

### 5. Run

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) for the public gallery.
Visit [http://localhost:3000/admin](http://localhost:3000/admin) for the dashboard.

---

## 🐳 Docker Deployment

```bash
# Copy and configure environment
cp .env.example .env
# Edit .env with your production values

# Build and start
docker-compose up -d
```

The app will be available on port `3000`. Photos and the database are persisted in Docker volumes.

### Production Environment Variables

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret
ADMIN_EMAIL=your-email@gmail.com
DATABASE_URL="file:./prisma/prod.db"
```

Don't forget to add your production domain to the **Authorized redirect URIs** in Google Cloud:
```
https://yourdomain.com/api/auth/callback/google
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Public homepage (album grid)
│   ├── albums/[slug]/page.tsx    # Album detail page
│   ├── admin/
│   │   ├── page.tsx              # Dashboard overview
│   │   ├── albums/               # Album management
│   │   └── settings/             # Site settings
│   └── api/
│       ├── auth/                 # NextAuth endpoints
│       ├── albums/               # Album CRUD API
│       ├── picker/               # Google Photos Picker API
│       └── settings/             # Site settings API
├── components/
│   ├── AlbumGrid.tsx             # Public album grid
│   ├── PhotoGallery.tsx          # Photo grid with lightbox
│   ├── Lightbox.tsx              # Full-screen photo viewer
│   ├── Navbar.tsx                # Public navigation
│   ├── Footer.tsx                # Site footer
│   └── AdminSidebar.tsx          # Admin navigation
├── lib/
│   ├── auth.ts                   # NextAuth configuration
│   ├── db.ts                     # Prisma client
│   ├── google-picker.ts          # Picker API wrapper
│   └── image-cache.ts            # Image download & caching
└── types/
    └── index.ts                  # Shared TypeScript types
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Auth | NextAuth.js v5 (Auth.js) |
| Database | SQLite via Prisma |
| Styling | Vanilla CSS (CSS Modules) |
| Images | next/image with local caching |
| Photos API | Google Photos Picker API |

---

## 🔒 Security

- Admin access is restricted to the `ADMIN_EMAIL` configured in `.env`
- All admin routes are protected by NextAuth middleware
- Google Photos access tokens are stored securely in the database
- The Picker API follows Google's privacy-first design — you only get access to photos the user explicitly selects

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

Apache 2.0 — see [LICENSE](LICENSE) for details.
