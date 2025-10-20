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
    };
  }
  
  interface User {
    id: string;
    email: string;
    name: string | null;
    role: string;
    clientId: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    clientId: string | null;
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
          // Query user from database
          const user = await db.query.users.findFirst({
            where: eq(users.email, email),
          });

          if (!user) {
            throw new Error('User not found');
          }

          // Verify password using bcryptjs
          const passwordMatch = await bcrypt.compare(password, user.passwordHash);
          if (!passwordMatch) {
            throw new Error('Invalid password');
          }

          if (!user.isActive) {
            throw new Error('User account is inactive');
          }

          // Return user object for session
          return {
            id: user.id,
            email: user.email,
            name: user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : user.firstName || user.email,
            role: user.role,
            clientId: user.clientId,
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
        token.role = (user as { role?: string }).role || 'CLIENT';
        token.clientId = (user as { clientId?: string | null }).clientId || null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.clientId = token.clientId as string | null;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET || 'dev-secret-key-uysp-client-portal-2025-change-in-production',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  debug: process.env.NODE_ENV === 'development',
};
