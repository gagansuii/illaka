import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// NEXTAUTH_SECRET must always be set — there is no insecure fallback.
// In production a missing secret will cause NextAuth to refuse to start.
// In development set NEXTAUTH_SECRET in .env.local (any non-empty value works).
const authSecret = process.env.NEXTAUTH_SECRET;

// 14 days — balances UX (users aren't logged out constantly) against the
// blast radius of a stolen session cookie.
const SESSION_MAX_AGE_SECONDS = 14 * 24 * 60 * 60;

export const authOptions: NextAuthOptions = {
  // Persist login across refresh/revisit using NextAuth JWT httpOnly cookies.
  session: { strategy: 'jwt', maxAge: SESSION_MAX_AGE_SECONDS },
  jwt: { maxAge: SESSION_MAX_AGE_SECONDS },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const normalizedEmail = credentials.email.toLowerCase().trim();
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role };
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login'
  },
  secret: authSecret
};
