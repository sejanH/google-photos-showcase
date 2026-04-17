import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for Photo Showcase. All images are served via Google Photos and no user data is stored.",
};

export default async function TermsOfServicePage() {
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

          <h1 className={styles.title}>Terms of Service</h1>
          <p className={styles.lastUpdated}>Last updated: April 17, 2026</p>

          <div className={styles.content}>
            <h2>Acceptance of Terms</h2>
            <p>
              By accessing and using <strong>{siteName}</strong>, you agree to be bound by these
              Terms of Service. If you do not agree to these terms, please do not use this website.
            </p>

            <h2>Description of Service</h2>
            <p>
              <strong>{siteName}</strong> is a photo showcase website that displays curated photo
              albums. The service is provided as-is for the purpose of viewing photographs.
            </p>
            <ul>
              <li>All images are served directly from Google Photos via Google&apos;s infrastructure.</li>
              <li>No images are stored, cached, or hosted on our servers.</li>
              <li>No user accounts are required to browse the gallery.</li>
            </ul>

            <h2>Intellectual Property</h2>
            <p>
              All photographs displayed on this website are the intellectual property of their
              respective owners. The photos are shared through Google Photos and displayed via
              Google&apos;s official APIs. Unauthorized reproduction, distribution, or use of these
              images is prohibited.
            </p>

            <h2>No Data Collection</h2>
            <p>
              We do not collect, store, or process any personal data from visitors.
              For more details, please review our{" "}
              <Link href="/privacy">Privacy Policy</Link>.
            </p>

            <h2>Third-Party Services</h2>
            <p>
              This website integrates with third-party services that have their own terms:
            </p>
            <ul>
              <li>
                <strong>Google Photos / Google APIs</strong> — Usage is subject to{" "}
                <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">
                  Google&apos;s Terms of Service
                </a>
              </li>
              <li>
                <strong>Vercel</strong> — Hosting is subject to{" "}
                <a href="https://vercel.com/legal/terms" target="_blank" rel="noopener noreferrer">
                  Vercel&apos;s Terms of Service
                </a>
              </li>
            </ul>

            <h2>Limitation of Liability</h2>
            <p>
              This website is provided &quot;as is&quot; without any warranties, express or implied.
              We are not responsible for:
            </p>
            <ul>
              <li>The availability or accuracy of images served by Google Photos.</li>
              <li>Any interruptions or errors in the service.</li>
              <li>Any damages resulting from the use of this website.</li>
            </ul>

            <h2>Changes to These Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Changes will be effective
              immediately upon posting to this page. Your continued use of the website after
              changes constitutes acceptance of the updated terms.
            </p>

            <h2>Contact</h2>
            <p>
              If you have any questions about these terms, please reach out to the site owner
              through the contact information available on the website.
            </p>
          </div>
        </div>
      </main>

      <Footer siteName={siteName} ownerName={settings?.ownerName || undefined} />
    </div>
  );
}
