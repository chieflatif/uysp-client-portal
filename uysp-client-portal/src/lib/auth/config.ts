import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

// Type augmentation for NextAuth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
      role: string;
      clientId: string | null;
      mustChangePassword: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string | null;
    role: string;
    clientId: string | null;
    mustChangePassword: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    clientId: string | null;
    mustChangePassword: boolean;
  }
}

// Validation schema for login
const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'your@email.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Validate input
        const result = loginSchema.safeParse(credentials);
        if (!result.success) {
          throw new Error('Invalid credentials');
        }

        const { email, password } = result.data;

        try {
          // Add timeout to database query
          const startTime = Date.now();

          // Query user from database (case-insensitive email lookup)
          const user = await db.query.users.findFirst({
            where: eq(users.email, email.toLowerCase()),
          });

          console.log(`[Auth] DB query took ${Date.now() - startTime}ms`);

          if (!user) {
            throw new Error('User not found');
          }

          // Verify password using bcryptjs
          const hashStartTime = Date.now();
          const passwordMatch = await bcrypt.compare(password, user.passwordHash);
          console.log(`[Auth] Password verification took ${Date.now() - hashStartTime}ms`);

          if (!passwordMatch) {
            throw new Error('Invalid password');
          }

          if (!user.isActive) {
            throw new Error('User account is inactive');
          }

          console.log(`[Auth] Total auth time: ${Date.now() - startTime}ms`);

          // Return user object for session
          return {
            id: user.id,
            email: user.email,
            name: user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.firstName || user.email,
            role: user.role,
            clientId: user.clientId,
            mustChangePassword: user.mustChangePassword || false,
          };
        } catch (error) {
          console.error('Auth error:', error instanceof Error ? error.message : 'Unknown error');
          throw error;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || 'CLIENT_USER';
        token.clientId = (user as { clientId?: string | null }).clientId || null;
        token.mustChangePassword = (user as { mustChangePassword?: boolean }).mustChangePassword || false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.clientId = token.clientId as string | null;
        session.user.mustChangePassword = token.mustChangePassword as boolean;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET ||
      (process.env.NODE_ENV === 'development'
        ? 'dev-secret-key-uysp-client-portal-2025'
        : undefined), // No fallback in production - will throw error
    maxAge: 24 * 60 * 60, // 24 hours
  },
  debug: process.env.NODE_ENV === 'development',
};

// SECURITY: Validate NEXTAUTH_SECRET in production
if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET must be set in production environment');
}
