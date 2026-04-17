import styles from "./Footer.module.css";

interface FooterProps {
  siteName?: string;
  ownerName?: string;
}

export default function Footer({
  siteName = "Photo Showcase",
  ownerName,
}: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <span className={styles.brand}>{siteName}</span>
          <span className={styles.separator}>·</span>
          <span className={styles.copyright}>
            © {year} {ownerName || siteName}
          </span>
        </div>
        <div className={styles.right}>
          <span className={styles.powered}>
            Powered by{" "}
            <a
              href="https://developers.google.com/photos"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.poweredLink}
            >
              Google Photos
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
