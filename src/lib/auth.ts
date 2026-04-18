import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" }, // Use JWT to keep it simple and edge-friendly if needed
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
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
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }

      // Ensure Google OAuth tokens are persisted for Picker API usage.
      if (account?.provider === "google" && token.sub) {
        const updateData: {
          access_token?: string;
          refresh_token?: string;
          expires_at?: number;
          token_type?: string;
          scope?: string;
          id_token?: string;
          session_state?: string;
        } = {};

        if (typeof account.access_token === "string") {
          updateData.access_token = account.access_token;
        }
        if (typeof account.refresh_token === "string") {
          updateData.refresh_token = account.refresh_token;
        }
        if (typeof account.expires_at === "number") {
          updateData.expires_at = account.expires_at;
        }
        if (typeof account.token_type === "string") {
          updateData.token_type = account.token_type;
        }
        if (typeof account.scope === "string") {
          updateData.scope = account.scope;
        }
        if (typeof account.id_token === "string") {
          updateData.id_token = account.id_token;
        }
        if (typeof account.session_state === "string") {
          updateData.session_state = account.session_state;
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.account.updateMany({
            where: { userId: token.sub, provider: "google" },
            data: updateData,
          });
        }
      }

      return token;
    },
  },
});
