import NextAuth from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

export type UserRole = 'USER' | 'ORGANIZER' | 'ADMIN';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      name?: string | null;
      email?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: UserRole;
    rememberMe?: boolean;
    createdAt?: number;
  }
}
