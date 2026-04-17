import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" }, // Use JWT to keep it simple and edge-friendly if needed
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;

        // Attach access token to session for Picker API calls
        const account = await prisma.account.findFirst({
          where: { userId: token.sub, provider: "google" },
        });
        if (account) {
          (session as { accessToken?: string | null }).accessToken = account.access_token;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
});
