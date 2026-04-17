import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how Photo Showcase handles your data. We do not store any user data or images — everything is served directly through Google Photos.",
};

export default async function PrivacyPolicyPage() {
  const settings = await prisma.siteSettings
    .findFirst({ where: { id: "default" } })
    .catch(() => null);

  const siteName = settings?.siteName || "Photo Showcase";

  return (
    <div className={styles.page}>
      <Navbar siteName={siteName} />

      <main className={styles.main}>
        <div className={styles.container}>
          <Link href="/" className={styles.backLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Home
          </Link>

          <h1 className={styles.title}>Privacy Policy</h1>
          <p className={styles.lastUpdated}>Last updated: April 17, 2026</p>

          <div className={styles.content}>
            <h2>Overview</h2>
            <p>
              <strong>{siteName}</strong> is a photo showcase website that displays curated photo albums.
              We are committed to protecting your privacy. This policy explains how we handle data
              when you visit our site.
            </p>

            <h2>Data We Do Not Collect</h2>
            <p>
              We want to be transparent: <strong>we do not store any user information on our servers</strong>.
              Specifically:
            </p>
            <ul>
              <li>We do not collect, store, or process any personal data from visitors.</li>
              <li>We do not store any images or photos on our servers. All images are served directly from Google&apos;s infrastructure via secure, temporary URLs.</li>
              <li>We do not use cookies for tracking or advertising purposes.</li>
              <li>We do not have user accounts for visitors — the site is publicly viewable.</li>
            </ul>

            <h2>Google Photos Integration</h2>
            <p>
              All photos displayed on this website are sourced from <strong>Google Photos</strong> using
              Google&apos;s official Picker API. Images are proxied from Google&apos;s servers in real-time and
              are never downloaded or stored locally. The temporary image URLs expire every 60 minutes
              and are refreshed automatically.
            </p>

            <h2>Admin Authentication</h2>
            <p>
              The administrative section of this website uses <strong>Google OAuth 2.0</strong> for
              authentication. This is limited to the site owner only. Authentication sessions are
              managed by NextAuth.js, and login credentials are handled entirely by Google&apos;s
              secure authentication infrastructure.
            </p>

            <h2>Third-Party Services</h2>
            <p>This website relies on the following third-party services:</p>
            <ul>
              <li>
                <strong>Google Photos API</strong> — for sourcing and displaying images.
                Google&apos;s privacy policy applies:{" "}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                  policies.google.com/privacy
                </a>
              </li>
              <li>
                <strong>Vercel</strong> — for hosting and serving the website.
                Vercel&apos;s privacy policy applies:{" "}
                <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
                  vercel.com/legal/privacy-policy
                </a>
              </li>
            </ul>

            <h2>Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. Any changes will be reflected
              on this page with an updated revision date.
            </p>

            <h2>Contact</h2>
            <p>
              If you have any questions about this privacy policy, please reach out to the site owner
              through the contact information available on the website.
            </p>
          </div>
        </div>
      </main>

      <Footer siteName={siteName} ownerName={settings?.ownerName || undefined} />
    </div>
  );
}
