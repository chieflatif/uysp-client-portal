/**
 * User Registration Endpoint
 * 
 * POST /api/users/register
 * 
 * Creates a new user account with email and password.
 * Password is hashed before storage using bcryptjs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Validation schema for registration
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
});

type RegisterRequest = z.infer<typeof registerSchema>;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName }: RegisterRequest = validation.data;

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password with bcryptjs
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user in database
    const newUser = await db.insert(users).values({
      email,
      passwordHash,
      firstName,
      lastName,
      role: 'CLIENT',
      isActive: true,
    }).returning({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
    });

    // Return success with user data (no password hash)
    return NextResponse.json(
      {
        id: newUser[0]?.id,
        email: newUser[0]?.email,
        firstName: newUser[0]?.firstName,
        lastName: newUser[0]?.lastName,
        role: newUser[0]?.role,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
