import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SessionProvider } from "next-auth/react";
import AdminSidebar from "@/components/AdminSidebar";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import styles from "./layout.module.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: {
    default: "Admin Dashboard",
    template: "%s | Admin",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = (await headers()).get("x-pathname");
  const session = await auth();

  // Don't show sidebar on login page
  if (!session) {
    return <>{children}</>;
  }

  if (pathname !== "/admin/login") {
    const userId = (session.user as { id?: string | null } | undefined)?.id;
    const now = Math.floor(Date.now() / 1000);

    const googleAccount = userId
      ? await prisma.account.findFirst({
          where: { userId, provider: "google" },
          select: {
            access_token: true,
            refresh_token: true,
            expires_at: true,
          },
        })
      : null;

    const hasAnyToken = Boolean(
      googleAccount?.refresh_token || googleAccount?.access_token
    );
    const accessExpired = Boolean(
      googleAccount?.expires_at && googleAccount.expires_at <= now
    );
    const canRefresh = Boolean(googleAccount?.refresh_token);
    const needsReauth =
      !googleAccount || !hasAnyToken || (accessExpired && !canRefresh);

    if (needsReauth) {
      const callbackUrl = pathname && pathname.startsWith("/admin")
        ? pathname
        : "/admin";
      redirect(
        `/admin/login?reauth=true&callbackUrl=${encodeURIComponent(callbackUrl)}`
      );
    }
  }

  return (
    <SessionProvider session={session}>
      <div className={styles.layout}>
        <AdminSidebar user={session.user} />
        <main className={styles.content}>{children}</main>
      </div>
    </SessionProvider>
  );
}
