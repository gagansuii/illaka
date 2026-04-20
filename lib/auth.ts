import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getEnv } from './config';

type Nullable = string | undefined;
let authSecret: Nullable;
try {
  authSecret = getEnv('NEXTAUTH_SECRET');
} catch {
  authSecret = process.env.NODE_ENV === 'production' ? undefined : 'dev-secret';
}

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days
const SESSION_SHORT_AGE_SECONDS = 24 * 60 * 60;    // 24 hours (no Remember Me)

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: SESSION_MAX_AGE_SECONDS },
  jwt: { maxAge: SESSION_MAX_AGE_SECONDS },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        rememberMe: { label: 'Remember Me', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const normalizedEmail = credentials.email.toLowerCase().trim();
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          rememberMe: credentials.rememberMe === 'true'
        };
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.rememberMe = (user as any).rememberMe ?? true;
        token.createdAt = Math.floor(Date.now() / 1000);

        // Short session: expire after 24 hours when Remember Me is unchecked
        if (!token.rememberMe) {
          token.exp = Math.floor(Date.now() / 1000) + SESSION_SHORT_AGE_SECONDS;
        }
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
