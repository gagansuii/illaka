import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { loginGuard } from '@/lib/login-guard';

const isProd = process.env.NODE_ENV === 'production';
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days
const SESSION_SHORT_AGE_SECONDS = 24 * 60 * 60;     // 1 day (no-remember)

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: SESSION_MAX_AGE_SECONDS },
  jwt: { maxAge: SESSION_MAX_AGE_SECONDS },

  // Explicit, hardened cookie settings
  cookies: {
    sessionToken: {
      name: isProd ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',   // 'strict' breaks some redirect flows; 'lax' is the safe default
        path: '/',
        secure: isProd,
      },
    },
    callbackUrl: {
      name: isProd ? '__Secure-next-auth.callback-url' : 'next-auth.callback-url',
      options: { sameSite: 'lax', path: '/', secure: isProd },
    },
    csrfToken: {
      name: isProd ? '__Host-next-auth.csrf-token' : 'next-auth.csrf-token',
      options: { httpOnly: true, sameSite: 'lax', path: '/', secure: isProd },
    },
  },

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        rememberMe: { label: 'Remember Me', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const normalizedEmail = credentials.email.toLowerCase().trim();

        // --- Rate limit + lockout check (before any DB query to save resources) ---
        if (!(await loginGuard.isAllowed(normalizedEmail))) {
          // Return null without distinguishing between rate-limited and locked —
          // callers see the same 401 so they can't fingerprint which limit was hit.
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) {
          // Record failure even for unknown emails to prevent timing-based enumeration
          loginGuard.recordFailure(normalizedEmail);
          return null;
        }

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) {
          loginGuard.recordFailure(normalizedEmail);
          return null;
        }

        // Successful login — reset failure counter
        loginGuard.recordSuccess(normalizedEmail);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          rememberMe: credentials.rememberMe === 'true',
        };
      },
    }),
  ],

  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        const u = user as unknown as Record<string, unknown>;
        token.id = u.id;
        token.role = u.role;
        token.rememberMe = u.rememberMe ?? true;
        token.createdAt = Math.floor(Date.now() / 1000);

        if (!token.rememberMe) {
          token.exp = Math.floor(Date.now() / 1000) + SESSION_SHORT_AGE_SECONDS;
        }
      }
      return token;
    },

    session: async ({ session, token }) => {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.id;
        (session.user as Record<string, unknown>).role = token.role;
      }
      return session;
    },
  },

  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
};
