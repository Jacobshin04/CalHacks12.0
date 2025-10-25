import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

const authOptions = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          prompt: "select_account", // Allow users to select different accounts
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/signin" },
  callbacks: {
    async jwt({ token, account }) {
      if (account) token.accessToken = account.access_token;
      return token;
    },
    async session({ session, token }) {
      if (token.accessToken) (session as any).accessToken = token.accessToken;
      return session;
    },
  },
};

// ✅ New API: NextAuth returns an object with `.handlers`
const { handlers } = NextAuth(authOptions);

// ✅ Must use handlers.GET / handlers.POST now
export const GET = handlers.GET;
export const POST = handlers.POST;
