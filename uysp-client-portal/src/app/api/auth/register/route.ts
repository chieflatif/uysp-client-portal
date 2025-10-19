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
    console.log('📝 Register request received');
    
    const body = await request.json();
    console.log('📦 Request body:', { email: body.email, firstName: body.firstName, lastName: body.lastName });

    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.flatten());
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
    console.log('🔍 Checking if user exists:', email);
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      console.log('⚠️ User already exists:', email);
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password using bcrypt
    console.log('🔐 Hashing password');
    const passwordHash = await bcrypt.hash(password, 10);

    // Create new user
    console.log('👤 Creating new user:', { email, firstName, lastName });
    const newUser = await db.insert(users).values({
      email,
      passwordHash,
      firstName,
      lastName,
      role: 'CLIENT',
      isActive: true,
    }).returning();

    console.log('✅ User created:', newUser[0]?.id);

    if (!newUser || newUser.length === 0) {
      console.log('❌ No user returned from insert');
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Return user data without password
    const createdUser = newUser[0];
    return NextResponse.json(
      {
        id: createdUser.id,
        email: createdUser.email,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        role: createdUser.role,
      },
      { status: 201 }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Registration error:', errorMsg);
    console.error('Full error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error', details: errorMsg },
      { status: 500 }
    );
  }
}
