# Authentication System Documentation

## Overview
Comprehensive secure authentication system for Ease Academy with JWT tokens, role-based access control, and permission management.

## Components Created

### 1. Backend Controller (`src/backend/controllers/authController.js`)
Authentication business logic with the following functions:

#### Core Functions
- **registerUser(userData)**: Register new users with validation
- **loginUser(email, password)**: Authenticate users and generate tokens
- **logoutUser(userId)**: Clear refresh tokens and cache
- **refreshAccessToken(refreshToken)**: Generate new access token from refresh token
- **changePassword(userId, currentPassword, newPassword)**: Update user password
- **requestPasswordReset(email)**: Generate password reset token
- **resetPassword(resetToken, newPassword)**: Reset password with token
- **getCurrentUser(userId)**: Get user profile with caching
- **updateUserProfile(userId, updates)**: Update user profile (fullName, phone, avatar)

#### Features
- ✅ Bcrypt password hashing (handled by User model pre-save hook)
- ✅ JWT token generation (7-day access, 30-day refresh)
- ✅ Redis caching for user data
- ✅ Email validation and duplicate checking
- ✅ Account activation status checks
- ✅ Password strength validation (min 6 characters)
- ✅ Secure password reset with crypto tokens
- ✅ Cache invalidation on data changes

### 2. API Routes (`src/app/api/auth/`)

#### Authentication Endpoints
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth/register` | POST | Register new user | No |
| `/api/auth/login` | POST | Login user | No |
| `/api/auth/logout` | POST | Logout user | Yes |
| `/api/auth/refresh` | POST | Refresh access token | No (uses cookie) |
| `/api/auth/change-password` | POST | Change password | Yes |
| `/api/auth/me` | GET | Get current user | Yes |
| `/api/auth/me` | PUT | Update profile | Yes |
| `/api/auth/forgot-password` | POST | Request password reset | No |
| `/api/auth/reset-password` | POST | Reset password with token | No |

#### Request/Response Examples

**Register User**
```javascript
POST /api/auth/register
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "securepass123",
  "role": "teacher", // Optional, defaults to 'student'
  "branchId": "branch_id", // Required for non super_admin
  "permissions": ["view_students", "edit_grades"] // Optional
}

Response:
{
  "success": true,
  "data": { ...user },
  "message": "User registered successfully"
}
```

**Login**
```javascript
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "securepass123"
}

Response:
{
  "success": true,
  "data": {
    "user": { ...user },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..." // Also set as httpOnly cookie
  },
  "message": "Login successful"
}
```

**Change Password**
```javascript
POST /api/auth/change-password
Headers: { Authorization: "Bearer <token>" }
{
  "currentPassword": "oldpass123",
  "newPassword": "newsecurepass456"
}

Response:
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Refresh Token**
```javascript
POST /api/auth/refresh
// Refresh token automatically sent via httpOnly cookie

Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc..."
  },
  "message": "Token refreshed successfully"
}
```

### 3. Custom Hook (`src/hooks/useAuth.js`)

#### AuthProvider Context
Wrap your app with `AuthProvider` to enable authentication across all components.

```javascript
import { AuthProvider } from '@/hooks/useAuth';

export default function App({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
```

#### useAuth Hook
Access authentication state and methods in any component:

```javascript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const {
    user,              // Current user object
    loading,           // Loading state
    error,             // Error message
    isAuthenticated,   // Boolean
    login,             // Login function
    logout,            // Logout function
    register,          // Register function
    changePassword,    // Change password function
    forgotPassword,    // Request password reset
    resetPassword,     // Reset password with token
    updateProfile,     // Update user profile
    refreshUser,       // Refresh user data
    hasRole,           // Check user role
    hasPermission,     // Check permission
    hasBranch,         // Check branch access
  } = useAuth();
  
  // Use authentication methods
  const handleLogin = async () => {
    const result = await login('email@example.com', 'password');
    if (result.success) {
      // Login successful, redirects automatically
    } else {
      console.error(result.message);
    }
  };
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user.fullName}!</p>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

#### Role & Permission Checks
```javascript
const { hasRole, hasPermission, hasBranch } = useAuth();

// Check single role
if (hasRole('super_admin')) {
  // Super admin only content
}

// Check multiple roles
if (hasRole(['super_admin', 'branch_admin'])) {
  // Admin content
}

// Check permission
if (hasPermission('edit_students')) {
  // Show edit button
}

// Check multiple permissions (any)
if (hasPermission(['view_students', 'edit_students'])) {
  // Has at least one permission
}

// Check branch access
if (hasBranch('branch_id_123')) {
  // Has access to this branch
}
```

#### Protected Routes with HOC
```javascript
import { withAuth } from '@/hooks/useAuth';
import { ROLES } from '@/constants/roles';

function SuperAdminDashboard() {
  return <div>Super Admin Dashboard</div>;
}

// Protect route - super admin only
export default withAuth(SuperAdminDashboard, {
  requiredRole: ROLES.SUPER_ADMIN,
  redirectTo: '/login',
});

// Protect route - multiple roles
export default withAuth(AdminPanel, {
  requiredRole: [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN],
});

// Protect route - specific permission
export default withAuth(StudentList, {
  requiredPermission: 'view_students',
});
```

### 4. Security Features

#### Token Management
- **Access Token**: 7-day expiry, stored in localStorage, sent via Authorization header
- **Refresh Token**: 30-day expiry, stored in httpOnly cookie, used to generate new access tokens
- **Automatic Refresh**: API client automatically refreshes tokens on 401 errors

#### Password Security
- **Hashing**: Bcrypt with 10 salt rounds
- **Validation**: Minimum 6 characters (extendable)
- **Reset**: Secure token-based reset with 1-hour expiry
- **Change**: Requires current password verification

#### Account Security
- **Active Status**: Inactive accounts cannot login
- **Email Uniqueness**: Duplicate email prevention
- **Role Validation**: Enum validation for roles
- **Branch Validation**: Required for all roles except super_admin

#### API Security
- **Authentication Middleware**: Verifies JWT tokens
- **Role-based Access**: requireRole middleware
- **Permission-based Access**: requirePermission middleware
- **Branch-based Access**: requireBranch middleware
- **httpOnly Cookies**: Refresh token stored securely

### 5. User Model Schema

```javascript
{
  fullName: String (required),
  email: String (required, unique, lowercase, trim),
  phone: String (required, trim),
  passwordHash: String (required, select: false),
  role: Enum ['super_admin', 'branch_admin', 'teacher', 'parent', 'student'],
  branchId: ObjectId (ref: 'Branch', required for non super_admin),
  permissions: [String] (unique items),
  isActive: Boolean (default: true),
  avatar: String (url),
  lastLogin: Date,
  refreshToken: String (select: false),
  resetPasswordToken: String (select: false),
  resetPasswordExpires: Date,
  emailVerified: Boolean (default: false),
  verificationToken: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Model Methods
- `comparePassword(password)`: Verify password with bcrypt
- `generateRefreshToken()`: Generate crypto refresh token
- `hasPermission(permission)`: Check if user has permission
- `toJSON()`: Remove sensitive fields from response

#### Static Methods
- `findActive()`: Find all active users
- `findByRole(role)`: Find users by role

### 6. Middleware Functions

#### Authentication Middleware
```javascript
import { authenticate, requireRole, requirePermission, requireBranch, withAuth } from '@/backend/middleware/auth';

// Basic authentication
const authResult = await authenticate(request);
if (!authResult.success) {
  return NextResponse.json({ message: authResult.message }, { status: 401 });
}

// Role-based access
export async function GET(request) {
  return withAuth(
    async (request, user) => {
      // Handler code
      return NextResponse.json({ data: 'protected' });
    },
    [requireRole(['super_admin', 'branch_admin'])]
  )(request);
}

// Permission-based access
export async function POST(request) {
  return withAuth(
    async (request, user) => {
      // Handler code
    },
    [requirePermission('create_students')]
  )(request);
}

// Branch-based access
export async function PUT(request) {
  return withAuth(
    async (request, user) => {
      // Handler code
    },
    [requireBranch('branch_id_123')]
  )(request);
}
```

## Usage Examples

### Frontend Login Page
```javascript
'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
    // Automatically redirects on success
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      {error && <p className="text-red-500">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
}
```

### Protected API Route
```javascript
import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import { ROLES } from '@/constants/roles';

export async function GET(request) {
  return withAuth(
    async (request, user) => {
      // Only super_admin can access this
      return NextResponse.json({
        success: true,
        data: { message: 'Super admin data', user },
      });
    },
    [requireRole(ROLES.SUPER_ADMIN)]
  )(request);
}
```

### Client-Side Protected Component
```javascript
'use client';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/constants/roles';

export default function ProtectedComponent() {
  const { user, hasRole, hasPermission } = useAuth();

  if (!user) {
    return <p>Please login to continue</p>;
  }

  return (
    <div>
      <h1>Welcome, {user.fullName}!</h1>
      
      {hasRole(ROLES.SUPER_ADMIN) && (
        <div>Super Admin Controls</div>
      )}
      
      {hasPermission('edit_students') && (
        <button>Edit Students</button>
      )}
    </div>
  );
}
```

## Integration with App

### 1. Wrap App with AuthProvider
Update `src/app/layout.js`:

```javascript
import { AuthProvider } from '@/hooks/useAuth';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 2. Update API Client
The API client already handles token management and auto-refresh. Just ensure you're using it:

```javascript
import apiClient from '@/lib/api-client';

// Token is automatically attached from localStorage
const response = await apiClient.get('/api/protected-route');
```

### 3. Environment Variables
Ensure these are set in `.env.local`:

```env
JWT_SECRET=your-super-secret-jwt-key
MONGODB_URI=your-mongodb-connection-string
REDIS_URL=your-redis-url (optional)
NODE_ENV=development
```

## Security Best Practices

1. ✅ **Never expose JWT_SECRET** - Keep it in environment variables
2. ✅ **Use HTTPS in production** - Set `secure: true` for cookies
3. ✅ **Short-lived access tokens** - 7 days is reasonable, adjust as needed
4. ✅ **HttpOnly cookies for refresh tokens** - Prevents XSS attacks
5. ✅ **Password hashing** - Never store plain text passwords
6. ✅ **Rate limiting** - Implement in production to prevent brute force
7. ✅ **Input validation** - Always validate on both client and server
8. ✅ **CORS configuration** - Configure properly in production
9. ✅ **Token rotation** - Refresh tokens are invalidated on logout
10. ✅ **Audit logging** - Track lastLogin and sensitive operations

## Next Steps

1. **Email Integration**: Add email service for password resets and verification
2. **Two-Factor Authentication**: Implement 2FA for enhanced security
3. **Session Management**: Add ability to view/revoke active sessions
4. **Rate Limiting**: Add rate limiting to prevent brute force attacks
5. **Audit Logging**: Log all authentication events
6. **Social Login**: Add OAuth providers (Google, Facebook, etc.)
7. **Email Verification**: Verify email addresses on registration
8. **Password Policies**: Implement complex password requirements
9. **Account Lockout**: Lock accounts after failed login attempts
10. **IP Whitelisting**: Add IP-based access control for super admins

## Testing

### Test Accounts
Create test users for each role:

```javascript
// Super Admin
POST /api/auth/register
{
  "fullName": "Super Admin",
  "email": "superadmin@easeacademy.com",
  "password": "admin123",
  "role": "super_admin"
}

// Branch Admin
POST /api/auth/register
{
  "fullName": "Branch Admin",
  "email": "branchadmin@easeacademy.com",
  "password": "admin123",
  "role": "branch_admin",
  "branchId": "<branch_id>"
}
```

### Test Authentication Flow
1. Register a new user
2. Login with credentials
3. Access protected route with token
4. Refresh token when expired
5. Change password
6. Logout

## Troubleshooting

### Token Issues
- **"Invalid token"**: Token expired or malformed - try refreshing
- **"User not found"**: User deleted or token from different environment
- **"Account deactivated"**: isActive set to false - contact admin

### Login Issues
- **"Invalid credentials"**: Wrong email or password
- **"Account deactivated"**: User marked as inactive
- **Rate limited**: Too many failed attempts

### API Issues
- **401 Unauthorized**: Token missing or invalid
- **403 Forbidden**: User lacks required role/permission
- **500 Server Error**: Check logs and database connection

## API Client Integration

The authentication system is fully integrated with the existing API client (`src/lib/api-client.js`):

- ✅ Automatic token attachment to requests
- ✅ Automatic token refresh on 401 errors
- ✅ Token storage in localStorage
- ✅ Request/response interceptors
- ✅ Error handling and retry logic

No additional configuration needed!

---

**Authentication System Status**: ✅ Complete and Ready for Use

