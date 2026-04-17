"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";

interface Settings {
  siteName: string;
  siteTagline: string;
  ownerName: string;
  socialLinks: {
    instagram?: string;
    twitter?: string;
    website?: string;
    github?: string;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    siteName: "",
    siteTagline: "",
    ownerName: "",
    socialLinks: {},
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((result) => {
        if (result.data) {
          setSettings({
            siteName: result.data.siteName || "",
            siteTagline: result.data.siteTagline || "",
            ownerName: result.data.ownerName || "",
            socialLinks: result.data.socialLinks
              ? JSON.parse(result.data.socialLinks)
              : {},
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error("Failed to save settings");
      setSuccess("Settings saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className="skeleton" style={{ width: 200, height: 32 }} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>
          Configure your photo showcase website.
        </p>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}
      {success && <div className={styles.successBanner}>{success}</div>}

      <form onSubmit={handleSave}>
        {/* General */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>General</h2>

          <div className="field">
            <label htmlFor="settings-name" className="label">Site Name</label>
            <input
              id="settings-name"
              type="text"
              className="input"
              value={settings.siteName}
              onChange={(e) =>
                setSettings({ ...settings, siteName: e.target.value })
              }
              placeholder="My Photo Showcase"
            />
          </div>

          <div className="field">
            <label htmlFor="settings-tagline" className="label">Tagline</label>
            <input
              id="settings-tagline"
              type="text"
              className="input"
              value={settings.siteTagline}
              onChange={(e) =>
                setSettings({ ...settings, siteTagline: e.target.value })
              }
              placeholder="A curated collection of moments"
            />
          </div>

          <div className="field">
            <label htmlFor="settings-owner" className="label">Your Name</label>
            <input
              id="settings-owner"
              type="text"
              className="input"
              value={settings.ownerName}
              onChange={(e) =>
                setSettings({ ...settings, ownerName: e.target.value })
              }
              placeholder="John Doe"
            />
          </div>
        </div>

        {/* Social Links */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Social Links</h2>

          <div className="field">
            <label htmlFor="settings-instagram" className="label">Instagram</label>
            <input
              id="settings-instagram"
              type="url"
              className="input"
              value={settings.socialLinks.instagram || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  socialLinks: {
                    ...settings.socialLinks,
                    instagram: e.target.value,
                  },
                })
              }
              placeholder="https://instagram.com/yourusername"
            />
          </div>

          <div className="field">
            <label htmlFor="settings-twitter" className="label">Twitter / X</label>
            <input
              id="settings-twitter"
              type="url"
              className="input"
              value={settings.socialLinks.twitter || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  socialLinks: {
                    ...settings.socialLinks,
                    twitter: e.target.value,
                  },
                })
              }
              placeholder="https://twitter.com/yourusername"
            />
          </div>

          <div className="field">
            <label htmlFor="settings-website" className="label">Website</label>
            <input
              id="settings-website"
              type="url"
              className="input"
              value={settings.socialLinks.website || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  socialLinks: {
                    ...settings.socialLinks,
                    website: e.target.value,
                  },
                })
              }
              placeholder="https://yourwebsite.com"
            />
          </div>

          <div className="field">
            <label htmlFor="settings-github" className="label">GitHub</label>
            <input
              id="settings-github"
              type="url"
              className="input"
              value={settings.socialLinks.github || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  socialLinks: {
                    ...settings.socialLinks,
                    github: e.target.value,
                  },
                })
              }
              placeholder="https://github.com/yourusername"
            />
          </div>
        </div>

        <div className={styles.actions}>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
