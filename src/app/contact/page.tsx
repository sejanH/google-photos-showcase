import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import styles from "./contact.module.css";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Want to showcase your photos? Get in touch to learn about the process and fees.",
};

export default async function ContactPage() {
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

          <h1 className={styles.title}>Get In Touch</h1>
          <p className={styles.subtitle}>
            Interested in showcasing your photography? We&apos;d love to hear from you.
          </p>

          {/* CTA Card */}
          <div className={styles.ctaCard}>
            <div className={styles.ctaIconWrapper}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </div>
            <h2 className={styles.ctaTitle}>Showcase Your Photos</h2>
            <p className={styles.ctaDescription}>
              Want your photo albums featured on this platform? Whether you&apos;re a professional
              photographer, a hobbyist, or someone with a stunning collection — we can help you
              create a beautiful online showcase powered by Google Photos.
            </p>
            <p className={styles.ctaDescription}>
              Reach out to learn more about the process and fees.
            </p>

            <a href="mailto:sejan@sejan.xyz" className={styles.emailLink}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              sejan@sejan.xyz
            </a>
          </div>

          {/* FAQ-style info */}
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 className={styles.infoTitle}>How does it work?</h3>
              <p className={styles.infoText}>
                Your photos stay in your Google Photos account. We connect to them securely
                through Google&apos;s API — no uploads needed, no images stored on our end.
              </p>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 className={styles.infoTitle}>Is it secure?</h3>
              <p className={styles.infoText}>
                Absolutely. We never download or store your photos. Everything is served directly
                from Google&apos;s secure infrastructure with temporary, expiring URLs.
              </p>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
              <h3 className={styles.infoTitle}>What are the fees?</h3>
              <p className={styles.infoText}>
                Pricing depends on the number of albums and your requirements. Get in touch
                for a personalized quote — we keep it affordable.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer siteName={siteName} ownerName={settings?.ownerName || undefined} />
    </div>
  );
}
