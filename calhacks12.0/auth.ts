import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { env } from "./lib/env";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: env.GITHUB_ID!,
      clientSecret: env.GITHUB_SECRET!,
      authorization: {
        params: {
          prompt: "select_account", // Allow users to select different accounts
          scope: "read:user user:email repo", // Request repository access
        },
      },
    }),
  ],
  secret: env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/signin" },
  callbacks: {
    async jwt({ token, account, trigger, session }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (trigger === "update") {
        token = { ...token, ...session?.user };
      }
      return token;
    },
    async session({ session, token }) {
      if (token.accessToken) {
        (session as any).accessToken = token.accessToken;
      }
      return session;
    },
  },
});
