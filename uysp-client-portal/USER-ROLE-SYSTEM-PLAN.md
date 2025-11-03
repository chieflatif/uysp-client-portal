# User Role & Permission System - Implementation Plan

## 📋 Feature Request Summary

### User Hierarchy Requirements:
1. **SUPER_ADMIN** (Rebel HQ)
   - Can see ALL clients
   - Can add/manage all client admins and users
   - Full system access

2. **CLIENT_ADMIN** (Per Client)
   - Can see only their client's data
   - Can add ONE standard user to their client
   - Cannot see other clients
   - Maximum: 1 admin per client

3. **CLIENT_USER** (Per Client)
   - Can see only their client's data
   - Read-only or limited edit access
   - Cannot manage users
   - Maximum: 1 user per client

### Temporary Password Workflow:
1. Admin creates user → System generates temp password
2. Temp password displayed to admin (copy/send to user)
3. User logs in with temp password
4. System forces password change on first login
5. User sets new permanent password

### Visibility Rules:
- **SUPER_ADMIN**: Sees everything, all clients, all users
- **CLIENT_ADMIN**: Only their client data + can add 1 user
- **CLIENT_USER**: Only their client data, read-only access

---

## 🔍 Current System Analysis

### ✅ Already Implemented:
1. **Database Schema** (`/src/lib/db/schema.ts`):
   - ✅ `users.role` field (SUPER_ADMIN, ADMIN, CLIENT)
   - ✅ `users.mustChangePassword` boolean field
   - ✅ `users.clientId` foreign key
   - ✅ `users.isActive` status field

2. **Auth System** (`/src/lib/auth/config.ts`):
   - ✅ `mustChangePassword` in session/JWT
   - ✅ Role-based authentication
   - ✅ Client association

3. **Client Context** (`/src/contexts/ClientContext.tsx`):
   - ✅ Global client selector for SUPER_ADMIN
   - ✅ Client-locked view for ADMIN/CLIENT

### ❌ Missing Components:
1. **Role Differentiation**:
   - Need to split "CLIENT" into "CLIENT_ADMIN" and "CLIENT_USER"
   - Need user count limits per client

2. **User Management UI**:
   - No admin page to add users
   - No temporary password generation/display
   - No user list view

3. **Password Change Flow**:
   - No forced redirect when `mustChangePassword = true`
   - No change password page

4. **Visibility Controls**:
   - No enforcement of CLIENT_ADMIN vs CLIENT_USER permissions
   - No "add user" button for CLIENT_ADMIN

---

## 🎯 Implementation Plan

### Phase 1: Update Schema & Roles ✅
**Files to modify:**
- `/src/lib/db/schema.ts` - Update role enum
- `/src/lib/auth/config.ts` - Update role types

**Changes:**
```typescript
// OLD:
role: 'SUPER_ADMIN' | 'ADMIN' | 'CLIENT'

// NEW:
role: 'SUPER_ADMIN' | 'CLIENT_ADMIN' | 'CLIENT_USER'
```

**Migration:**
- Existing "ADMIN" → "CLIENT_ADMIN"
- Existing "CLIENT" → "CLIENT_USER"

---

### Phase 2: Forced Password Change Flow ✅
**Files to create:**
- `/src/app/(client)/change-password/page.tsx` - Change password UI
- `/src/app/api/auth/change-password/route.ts` - API endpoint

**Files to modify:**
- `/src/middleware.ts` - Add redirect logic for `mustChangePassword`

**Flow:**
```
1. User logs in with temp password
2. Middleware checks session.user.mustChangePassword
3. If true → redirect to /change-password (BLOCK all other pages)
4. User submits new password
5. API updates passwordHash, sets mustChangePassword = false
6. Redirect to dashboard
```

---

### Phase 3: Temporary Password Generation ✅
**Files to create:**
- `/src/lib/utils/password.ts` - Password generator utility

**Function:**
```typescript
export function generateTempPassword(): string {
  // Generate random 12-char password: Abc123!@xyz
  // Mix of uppercase, lowercase, numbers, special chars
}
```

---

### Phase 4: User Management UI ✅
**Files to create:**
- `/src/app/(client)/admin/users/page.tsx` - User management page
- `/src/app/api/admin/users/route.ts` - Create user API
- `/src/components/admin/AddUserModal.tsx` - Add user modal

**Features:**
1. **List Users Table**:
   - Show all users for current client (CLIENT_ADMIN)
   - Show all users across all clients (SUPER_ADMIN)
   - Columns: Name, Email, Role, Status, Created Date

2. **Add User Button**:
   - CLIENT_ADMIN: Only show if < 2 users exist (1 admin + 1 user max)
   - SUPER_ADMIN: Always show

3. **Add User Modal**:
   - Form: Email, First Name, Last Name, Role, Client (SUPER_ADMIN only)
   - Generate temp password on submit
   - Display temp password in modal (copy button)
   - Warning: "Send this password to the user. They must change it on first login."

---

### Phase 5: Role-Based Visibility ✅
**Files to modify:**
- `/src/app/(client)/layout.tsx` - Add role check wrapper
- `/src/components/navbar/Navbar.tsx` - Show/hide based on role
- All client pages - Add permission checks

**Visibility Matrix:**

| Feature | SUPER_ADMIN | CLIENT_ADMIN | CLIENT_USER |
|---------|-------------|--------------|-------------|
| View all clients | ✅ Yes | ❌ No | ❌ No |
| Client selector | ✅ Yes | ❌ No | ❌ No |
| View own client data | ✅ Yes | ✅ Yes | ✅ Yes |
| PM Dashboard | ✅ Yes | ✅ Yes | ✅ Yes |
| Inline edit tasks | ✅ Yes | ✅ Yes | ❌ No |
| Create tasks | ✅ Yes | ✅ Yes | ❌ No |
| Leads page | ✅ Yes | ✅ Yes | ✅ Yes (read-only) |
| Admin menu | ✅ Yes | ⚠️ Limited | ❌ No |
| User management | ✅ Yes | ⚠️ Add 1 user only | ❌ No |
| Sync button | ✅ Yes | ✅ Yes | ❌ No |

---

### Phase 6: Validation & Limits ✅
**Files to create:**
- `/src/lib/auth/permissions.ts` - Permission helper functions

**Validations:**
1. **User Count Limit**:
   ```typescript
   async function canAddUser(clientId: string, role: string): Promise<boolean> {
     const count = await db.select()
       .from(users)
       .where(eq(users.clientId, clientId));

     // Max 2 users per client: 1 CLIENT_ADMIN + 1 CLIENT_USER
     return count.length < 2;
   }
   ```

2. **Role Enforcement**:
   ```typescript
   async function canPerformAction(
     userId: string,
     action: string,
     targetClientId: string
   ): Promise<boolean> {
     const user = await getUser(userId);

     if (user.role === 'SUPER_ADMIN') return true;
     if (user.clientId !== targetClientId) return false;
     if (user.role === 'CLIENT_USER' && action === 'edit') return false;

     return true;
   }
   ```

---

## 📝 Detailed Implementation Steps

### Step 1: Update Database Schema
```sql
-- Migration to update existing roles
UPDATE users SET role = 'CLIENT_ADMIN' WHERE role = 'ADMIN';
UPDATE users SET role = 'CLIENT_USER' WHERE role = 'CLIENT';

-- Add constraint (optional, for future)
ALTER TABLE users ADD CONSTRAINT check_role
  CHECK (role IN ('SUPER_ADMIN', 'CLIENT_ADMIN', 'CLIENT_USER'));
```

### Step 2: Create Password Utility
**File**: `/src/lib/utils/password.ts`
```typescript
import crypto from 'crypto';

export function generateTempPassword(): string {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // No I, O
  const lowercase = 'abcdefghjkmnpqrstuvwxyz'; // No i, l, o
  const numbers = '23456789'; // No 0, 1
  const special = '!@#$%^&*';

  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Add 8 more random characters
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = 0; i < 8; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
```

### Step 3: Create Change Password Page
**File**: `/src/app/(client)/change-password/page.tsx`
- Form with: Current Password (if not temp), New Password, Confirm Password
- Validation: Min 8 chars, uppercase, lowercase, number, special
- Submit → API → Update password → Clear mustChangePassword → Redirect to dashboard

### Step 4: Add Middleware Redirect
**File**: `/src/middleware.ts`
```typescript
// After authentication check
if (session.user.mustChangePassword && req.nextUrl.pathname !== '/change-password') {
  return NextResponse.redirect(new URL('/change-password', req.url));
}

// Block change-password page if not flagged
if (!session.user.mustChangePassword && req.nextUrl.pathname === '/change-password') {
  return NextResponse.redirect(new URL('/dashboard', req.url));
}
```

### Step 5: Create User Management Page
**File**: `/src/app/(client)/admin/users/page.tsx`
- Table of users
- "Add User" button (with count check)
- Modal with form
- API call → Generate temp password → Display in modal

### Step 6: Create Add User API
**File**: `/src/app/api/admin/users/route.ts`
```typescript
POST /api/admin/users
{
  email, firstName, lastName, role, clientId (SUPER_ADMIN only)
}

1. Check permissions (SUPER_ADMIN or CLIENT_ADMIN)
2. Check user count limit (if CLIENT_ADMIN)
3. Generate temp password
4. Hash password
5. Create user with mustChangePassword = true
6. Return { user, tempPassword }
```

### Step 7: Update Navigation
**File**: `/src/components/navbar/Navbar.tsx`
- Show "Users" link only for SUPER_ADMIN and CLIENT_ADMIN
- Hide admin menu for CLIENT_USER

### Step 8: Add Permission Checks to Pages
**Files**: All page components
- Wrap edit actions in permission checks
- Disable buttons for CLIENT_USER
- Show read-only message if no permissions

---

## 🧪 Testing Checklist

### Test 1: User Creation & Temp Password
- [ ] SUPER_ADMIN creates CLIENT_ADMIN → Temp password displayed
- [ ] CLIENT_ADMIN creates CLIENT_USER → Temp password displayed
- [ ] CLIENT_ADMIN tries to create 2nd user → Blocked ("Max 1 user per client")
- [ ] CLIENT_USER doesn't see "Add User" button

### Test 2: First Login Flow
- [ ] New user logs in with temp password → Success
- [ ] User redirected to /change-password → Success
- [ ] User cannot access any other page → Blocked
- [ ] User changes password → Success
- [ ] User redirected to dashboard → Success
- [ ] mustChangePassword = false in DB → Success

### Test 3: Role-Based Visibility
- [ ] SUPER_ADMIN sees client selector → Yes
- [ ] SUPER_ADMIN sees all clients → Yes
- [ ] CLIENT_ADMIN sees only their client → Yes
- [ ] CLIENT_ADMIN doesn't see client selector → Correct
- [ ] CLIENT_USER sees only their client → Yes
- [ ] CLIENT_USER cannot edit tasks → Correct

### Test 4: Permission Enforcement
- [ ] CLIENT_USER clicks edit on task → Button disabled or hidden
- [ ] CLIENT_USER tries to sync → No sync button visible
- [ ] CLIENT_ADMIN can edit tasks → Success
- [ ] CLIENT_ADMIN can add user → Success (if < 2 users)
- [ ] CLIENT_ADMIN cannot see other clients → Correct

---

## 📊 Database State After Implementation

### Example: UYSP Client

```
clients
├─ id: 6a08f898-19cd-49f8-bd77-6fcb2dd56db9
├─ companyName: "UYSP"

users
├─ rebel@rebelhq.ai (SUPER_ADMIN, clientId: null)
├─ uysp-admin@example.com (CLIENT_ADMIN, clientId: 6a08f898...)
└─ uysp-user@example.com (CLIENT_USER, clientId: 6a08f898...)
```

### User Limits Per Client:
- **SUPER_ADMIN**: Unlimited (but clientId = null, not counted)
- **CLIENT_ADMIN**: Maximum 1 per client
- **CLIENT_USER**: Maximum 1 per client
- **Total per client**: 2 (1 admin + 1 user)

---

## 🚀 Deployment Steps

1. **Database Migration**:
   ```sql
   UPDATE users SET role = 'CLIENT_ADMIN' WHERE role = 'ADMIN';
   UPDATE users SET role = 'CLIENT_USER' WHERE role = 'CLIENT';
   ```

2. **Deploy Code**:
   - All new files and modified files
   - Verify no breaking changes

3. **Test in Production**:
   - SUPER_ADMIN login → Verify all access
   - Create test CLIENT_ADMIN → Verify limited access
   - Create test CLIENT_USER → Verify read-only

4. **Monitor**:
   - Check logs for permission errors
   - Verify temp passwords working
   - Confirm forced password change flow

---

## 📌 Summary

### Current State:
- ✅ Database schema supports roles
- ✅ Auth system passes role to session
- ✅ `mustChangePassword` field exists
- ❌ No UI for user management
- ❌ No forced password change flow
- ❌ No role-based visibility enforcement

### After Implementation:
- ✅ 3-tier role system (SUPER_ADMIN → CLIENT_ADMIN → CLIENT_USER)
- ✅ Temp password generation and display
- ✅ Forced password change on first login
- ✅ User management UI with limits (1 admin + 1 user per client)
- ✅ Role-based visibility across all pages
- ✅ Permission checks on all actions

---

**Status**: 📋 **PLANNING COMPLETE - READY FOR IMPLEMENTATION**
**Next Step**: Begin Phase 1 - Update Schema & Roles
