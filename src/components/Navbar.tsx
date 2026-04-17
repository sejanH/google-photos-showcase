import Link from "next/link";
import styles from "./Navbar.module.css";

interface NavbarProps {
  siteName?: string;
}

export default function Navbar({ siteName = "Photo Showcase" }: NavbarProps) {
  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <svg
            className={styles.logoIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className={styles.logoText}>{siteName}</span>
        </Link>
        <div className={styles.links}>
          <Link href="/" className={styles.link}>
            Gallery
          </Link>
        </div>
      </div>
    </nav>
  );
}
