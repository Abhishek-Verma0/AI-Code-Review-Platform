import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";

const handler = NextAuth({
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      await prisma.user.upsert({
        where: { githubId: profile.id.toString() },
        update: {
          accessToken: account.access_token,
        },
        create: {
          githubId: profile.id.toString(),
          email: user.email,
          name: user.name,
          avatarUrl: user.image,
          accessToken: account.access_token,
        },
      });

      return true;
    },
  },
});

export { handler as GET, handler as POST };