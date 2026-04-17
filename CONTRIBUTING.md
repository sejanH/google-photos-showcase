# Contributing to Google Photos Showcase

Thank you for your interest in contributing! This project is open-source under the Apache 2.0 license, and we welcome contributions of all kinds.

## Getting Started

### Prerequisites

- **Node.js** 20+
- **npm** 9+
- A **Google Cloud** project with the Photos Picker API enabled

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/google-photos-showcase.git
   cd google-photos-showcase
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Google OAuth credentials
   ```

4. **Set up the database**
   ```bash
   npx prisma db push
   ```

5. **Start the dev server**
   ```bash
   npm run dev
   ```

6. **Open** [http://localhost:3000](http://localhost:3000)

### Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Enable the **Google Photos Picker API**
4. Go to **APIs & Services → Credentials**
5. Create an **OAuth 2.0 Client ID** (Web Application)
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy the Client ID and Client Secret to your `.env` file

## Development Guidelines

### Code Style

- **TypeScript** is required for all new code
- Use **CSS Modules** for component styles (no Tailwind)
- Follow the existing design token system in `globals.css`
- Keep components focused and reusable

### Project Structure

```
src/
├── app/            # Next.js App Router pages and API routes
├── components/     # Reusable React components
├── lib/            # Utility libraries (auth, db, API wrappers)
└── types/          # Shared TypeScript type definitions
```

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add album sorting
fix: resolve lightbox navigation bug
docs: update setup instructions
style: improve mobile responsive layout
refactor: extract picker session logic
```

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Ensure the project builds: `npm run build`
5. Submit a pull request with a clear description

## Areas for Contribution

- 🐛 **Bug fixes** — Check the Issues tab
- 🎨 **UI improvements** — Better animations, responsive design
- 📱 **Mobile experience** — Touch interactions, swipe gestures
- 🌍 **i18n** — Internationalization support
- ♿ **Accessibility** — ARIA labels, keyboard navigation
- 📖 **Documentation** — Setup guides, screenshots
- 🧪 **Testing** — Unit and integration tests

## Questions?

Open an issue and we'll be happy to help!
