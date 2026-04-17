/* eslint-disable */
"use client";

import styles from "../app/admin/page.module.css";

export default function SignOutAction() {
  return (
    <a
      href="/api/auth/signout"
      className={styles.quickAction}
      style={{ background: 'none', border: '1px solid var(--color-border-subtle)', width: '100%', textAlign: 'left', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', textDecoration: 'none', display: 'flex' }}
    >
      <div className={styles.quickActionIcon} style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </div>
      <div className={styles.quickActionText}>
        <span className={styles.quickActionTitle}>Sign Out</span>
        <span className={styles.quickActionDesc}>End your admin session</span>
      </div>
      <div className={styles.quickActionArrow}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </a>
  );
}
