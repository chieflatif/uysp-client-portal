/**
 * RESILIENT AUTHENTICATION CONFIGURATION
 *
 * Enterprise-grade auth system with multiple fallback providers.
 * If Drizzle ORM fails, falls back to raw SQL.
 *
 * Post-Incident Response: October 24, 2025
 */

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

interface UserData {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  clientId: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
}

/**
 * AUTH PROVIDER INTERFACE
 * Each provider implements this interface
 */
interface AuthProvider {
  name: string;
  priority: number;
  fetchUser(email: string): Promise<UserData | null>;
}

/**
 * PROVIDER 1: Drizzle ORM (Primary)
 * Fastest, but vulnerable to schema issues
 */
class DrizzleORMProvider implements AuthProvider {
  name = 'Drizzle ORM';
  priority = 1;

  async fetchUser(email: string): Promise<UserData | null> {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      clientId: user.clientId,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword || false,
    };
  }
}

/**
 * PROVIDER 2: Direct PostgreSQL (Fallback)
 * Bypasses Drizzle completely - uses pg library directly
 * Most reliable, works even if Drizzle is completely broken
 */
class DirectPostgresProvider implements AuthProvider {
  name = 'Direct PostgreSQL';
  priority = 2;

  async fetchUser(email: string): Promise<UserData | null> {
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    try {
      const result = await pool.query(
        `SELECT
          id,
          email,
          password_hash,
          first_name,
          last_name,
          role,
          client_id,
          is_active,
          must_change_password
        FROM users
        WHERE email = $1
        AND is_active = true
        LIMIT 1`,
        [email]
      );

      if (result.rows.length === 0) return null;

      const row = result.rows[0];

      return {
        id: row.id,
        email: row.email,
        passwordHash: row.password_hash,
        firstName: row.first_name,
        lastName: row.last_name,
        role: row.role,
        clientId: row.client_id,
        isActive: row.is_active,
        mustChangePassword: row.must_change_password || false,
      };
    } finally {
      await pool.end();
    }
  }
}

/**
 * RESILIENT AUTH SYSTEM
 * Tries each provider in priority order
 */
class ResilientAuth {
  private providers: AuthProvider[];
  private failures: Map<string, number> = new Map();

  constructor() {
    this.providers = [
      new DrizzleORMProvider(),
      new DirectPostgresProvider(),
    ].sort((a, b) => a.priority - b.priority);
  }

  async fetchUser(email: string): Promise<UserData | null> {
    const errors: Array<{ provider: string; error: Error }> = [];

    for (const provider of this.providers) {
      try {
        console.log(`[Auth] Attempting provider: ${provider.name}`);
        const startTime = Date.now();

        const user = await provider.fetchUser(email);
        const duration = Date.now() - startTime;

        console.log(`[Auth] Provider ${provider.name} completed in ${duration}ms`);

        if (user) {
          // Alert if not using primary provider
          if (provider.priority > 1) {
            console.warn(`[Auth] ⚠️  Using fallback provider: ${provider.name}`);
            console.warn(`[Auth] Primary provider failures:`, errors);

            // Track failures for monitoring
            this.failures.set(provider.name, (this.failures.get(provider.name) || 0) + 1);

            // TODO: Send alert to ops team
            // await this.alertFallbackUsed(provider.name, errors);
          }

          return user;
        }

        // User not found with this provider, continue
        console.log(`[Auth] User not found with ${provider.name}`);
        return null;

      } catch (error) {
        console.error(`[Auth] Provider ${provider.name} failed:`, error);
        errors.push({
          provider: provider.name,
          error: error instanceof Error ? error : new Error('Unknown error')
        });

        // Continue to next provider
        continue;
      }
    }

    // All providers failed
    console.error('[Auth] ❌ All authentication providers failed');
    console.error('[Auth] Errors:', errors);

    // TODO: Alert ops team - CRITICAL
    // await this.alertAuthSystemFailure(errors);

    throw new Error('Authentication system failure - all providers unavailable');
  }
}

/**
 * AUTHENTICATION FUNCTION
 * Used by NextAuth CredentialsProvider
 */
async function authenticateUser(email: string, password: string) {
  const startTime = Date.now();

  try {
    const auth = new ResilientAuth();

    // Fetch user with resilient system
    const user = await auth.fetchUser(email);

    if (!user) {
      console.log(`[Auth] User not found: ${email}`);
      throw new Error('User not found');
    }

    // Verify password
    const hashStartTime = Date.now();
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    const hashDuration = Date.now() - hashStartTime;

    console.log(`[Auth] Password verification took ${hashDuration}ms`);

    if (!passwordMatch) {
      console.log(`[Auth] Invalid password for user: ${email}`);
      throw new Error('Invalid password');
    }

    if (!user.isActive) {
      console.log(`[Auth] Inactive user attempted login: ${email}`);
      throw new Error('User account is inactive');
    }

    const totalDuration = Date.now() - startTime;
    console.log(`[Auth] ✅ Authentication successful for ${email} in ${totalDuration}ms`);

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
    const totalDuration = Date.now() - startTime;
    console.error(`[Auth] ❌ Authentication failed for ${email} after ${totalDuration}ms`);
    console.error('[Auth] Error:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

/**
 * NEXTAUTH CONFIGURATION
 */
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

        return await authenticateUser(email, password);
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

// NOTE: NEXTAUTH_SECRET validation removed to support Next.js build-time static analysis
// NextAuth will validate the secret at runtime when the auth config is actually used
