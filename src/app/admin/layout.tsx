import { auth } from "@/lib/auth";
import { SessionProvider } from "next-auth/react";
import AdminSidebar from "@/components/AdminSidebar";
import styles from "./layout.module.css";

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
  const session = await auth();

  // Don't show sidebar on login page
  if (!session) {
    return <>{children}</>;
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
