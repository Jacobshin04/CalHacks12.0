import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          prompt: "select_account", // Allow users to select different accounts
          scope: "read:user user:email repo", // Request repository access
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
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
