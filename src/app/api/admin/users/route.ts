import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { canAddUser, canManageUsers, isSuperAdmin } from '@/lib/auth/permissions';
import { sendPasswordSetupEmail } from '@/lib/email/mailer';
import { z } from 'zod';

// Validation schema for creating a user
const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['CLIENT_ADMIN', 'CLIENT_USER']),
  clientId: z.string().uuid('Invalid client ID').optional(),
});

/**
 * POST /api/admin/users
 * Create a new user with temporary password
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage users
    if (!canManageUsers(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to create users' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createUserSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    const { email, firstName, lastName, role, clientId } = validationResult.data;

    // Determine target client ID
    let targetClientId: string;
    if (isSuperAdmin(session.user.role)) {
      // SUPER_ADMIN must specify clientId
      if (!clientId) {
        return NextResponse.json(
          { error: 'Client ID is required for SUPER_ADMIN' },
          { status: 400 }
        );
      }
      targetClientId = clientId;
    } else {
      // CLIENT_ADMIN uses their own clientId
      if (!session.user.clientId) {
        return NextResponse.json(
          { error: 'Your account is not associated with a client' },
          { status: 400 }
        );
      }
      targetClientId = session.user.clientId;
    }

    // Check if user can add to this client (respects user count limit)
    const addUserCheck = await canAddUser(
      session.user.id,
      session.user.role,
      targetClientId
    );

    if (!addUserCheck.canAdd) {
      return NextResponse.json(
        { error: addUserCheck.reason || 'Cannot add user' },
        { status: 403 }
      );
    }

    // Check if email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // Create user WITHOUT password - user will set it themselves
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        firstName,
        lastName,
        role,
        clientId: targetClientId,
        passwordHash: '', // Empty - user sets it themselves
        mustChangePassword: false, // Not needed with this flow
        isActive: true,
      })
      .returning();

    // Generate setup URL
    const setupUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/setup-password?email=${encodeURIComponent(email)}`;

    // Send invitation email
    try {
      await sendPasswordSetupEmail(email, firstName, setupUrl);
    } catch (emailError) {
      console.error('Email failed:', emailError);
      // Note: We continue even if email fails - admin can manually share the link
    }

    // Return user info and setup URL
    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        clientId: newUser.clientId,
      },
      setupUrl, // For manual sharing if email fails
      message: `Invitation email sent to ${email}`,
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/users
 * Get list of users based on role
 */
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage users
    if (!canManageUsers(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to view users' },
        { status: 403 }
      );
    }

    let usersList;
    let sanitizedUsers;

    if (isSuperAdmin(session.user.role)) {
      // SUPER_ADMIN sees all users with their client organization names
      const allUsers = await db.query.users.findMany({
        orderBy: (users, { desc }) => [desc(users.createdAt)],
      });

      // Fetch all clients to map clientId to companyName
      const allClients = await db.query.clients.findMany();
      const clientMap = new Map(allClients.map(c => [c.id, c.companyName]));

      // Add client organization name to each user
      sanitizedUsers = allUsers.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        clientId: user.clientId,
        clientOrganization: user.clientId ? clientMap.get(user.clientId) || 'Unknown' : 'N/A',
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      }));
    } else {
      // CLIENT_ADMIN sees only users in their client (excluding SUPER_ADMINs)
      if (!session.user.clientId) {
        return NextResponse.json(
          { error: 'Your account is not associated with a client' },
          { status: 400 }
        );
      }

      const allClientUsers = await db.query.users.findMany({
        where: eq(users.clientId, session.user.clientId),
        orderBy: (users, { desc }) => [desc(users.createdAt)],
      });

      // Filter out SUPER_ADMIN users - CLIENT_ADMIN should not see them
      usersList = allClientUsers.filter(user => user.role !== 'SUPER_ADMIN');

      // Remove sensitive data (no clientOrganization needed for CLIENT_ADMIN)
      sanitizedUsers = usersList.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        clientId: user.clientId,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      }));
    }

    return NextResponse.json({
      success: true,
      users: sanitizedUsers,
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
