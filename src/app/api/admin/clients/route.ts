import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { clients } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/admin/clients
 * 
 * Create a new client (ADMIN only)
 * TDD: Implementation to pass tests in tests/api/admin/clients.test.ts
 */

const createClientSchema = z.object({
  companyName: z.string().min(1, 'Company name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  airtableBaseId: z.string().regex(/^app[a-zA-Z0-9]{14}$/, 'Invalid Airtable Base ID format'),
});

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Authorization - Only ADMIN or SUPER_ADMIN
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validation
    const validation = createClientSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { companyName, email, phone, airtableBaseId } = validation.data;

    // Check if client with same email already exists
    const existing = await db.query.clients.findFirst({
      where: eq(clients.email, email),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Client with this email already exists', code: 'DUPLICATE_EMAIL' },
        { status: 409 }
      );
    }

    // Check if Airtable Base ID already in use
    const existingBase = await db.query.clients.findFirst({
      where: eq(clients.airtableBaseId, airtableBaseId),
    });

    if (existingBase) {
      return NextResponse.json(
        { error: 'Airtable Base ID already in use', code: 'DUPLICATE_BASE_ID' },
        { status: 409 }
      );
    }

    // Create client
    const newClient = await db.insert(clients).values({
      companyName,
      email,
      phone: phone || null,
      airtableBaseId,
      isActive: true,
    }).returning();

    return NextResponse.json(
      {
        success: true,
        client: newClient[0],
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/clients
 * 
 * Get all clients (ADMIN only)
 * TDD: Implementation to pass tests
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Authorization - Only ADMIN or SUPER_ADMIN
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Fetch all clients
    const allClients = await db.query.clients.findMany({
      orderBy: (clients, { desc }) => [desc(clients.createdAt)],
    });

    return NextResponse.json({
      success: true,
      clients: allClients,
      count: allClients.length,
    });

  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

