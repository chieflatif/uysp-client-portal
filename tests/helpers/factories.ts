import { randomUUID } from 'crypto';
import { InferInsertModel } from 'drizzle-orm';
import { db } from '@/lib/db';
import { clients, users, leads } from '@/lib/db/schema';

type ClientInsert = InferInsertModel<typeof clients>;
type UserInsert = InferInsertModel<typeof users>;
type LeadInsert = InferInsertModel<typeof leads>;

const defaultPhone = '555-0100';

const sanitizeBaseId = (id: string) => id.replace(/-/g, '').slice(0, 12);

export async function createTestClient(
  overrides: Partial<ClientInsert> = {}
) {
  const now = new Date();
  const id = overrides.id ?? randomUUID();
  const record: ClientInsert = {
    id,
    companyName: overrides.companyName ?? `Test Client ${id.slice(0, 6)}`,
    email: overrides.email ?? `client+${id.slice(0, 8)}@example.com`,
    phone: overrides.phone ?? defaultPhone,
    airtableBaseId:
      overrides.airtableBaseId ?? `app_test_${sanitizeBaseId(id)}`,
    isActive: overrides.isActive ?? true,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    ...overrides,
  };

  const [inserted] = await db.insert(clients).values(record).returning();
  return inserted;
}

export async function createTestUser(
  clientId: string,
  overrides: Partial<UserInsert> = {}
) {
  const now = new Date();
  const id = overrides.id ?? randomUUID();
  const email =
    overrides.email ?? `user+${sanitizeBaseId(id)}@example.com`;
  const record: UserInsert = {
    id,
    email,
    clientId,
    passwordHash: overrides.passwordHash ?? 'test-hash',
    firstName: overrides.firstName ?? 'Test',
    lastName: overrides.lastName ?? 'User',
    role: overrides.role ?? 'SUPER_ADMIN',
    isActive: overrides.isActive ?? true,
    mustChangePassword: overrides.mustChangePassword ?? false,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    ...overrides,
    clientId,
    email,
    id,
  };

  const [inserted] = await db.insert(users).values(record).returning();
  return inserted;
}

export async function createTestLead(
  clientId: string,
  overrides: Partial<LeadInsert> = {}
) {
  const now = new Date();
  const id = overrides.id ?? randomUUID();
  const record: LeadInsert = {
    id,
    clientId,
    airtableRecordId:
      overrides.airtableRecordId ?? `rec_${sanitizeBaseId(id)}`,
    firstName: overrides.firstName ?? 'Test',
    lastName: overrides.lastName ?? 'Lead',
    email:
      overrides.email ?? `lead+${sanitizeBaseId(id)}@example.com`,
    isActive: overrides.isActive ?? true,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    ...overrides,
    clientId,
    id,
  };

  const [inserted] = await db.insert(leads).values(record).returning();
  return inserted;
}

