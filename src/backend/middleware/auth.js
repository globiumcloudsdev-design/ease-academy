import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import User from '@/backend/models/User';
import connectDB from '@/lib/database';
import { ROLES, PERMISSIONS } from '@/constants/roles';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = '30d';

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    throw new Error('Invalid token');
  }
}

/**
 * Generate access token
 */
export function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}

/**
 * Extract token from request headers
 */
export function extractToken(request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7);
}

/**
 * Authenticate user from request
 * Returns user object or error
 */
export async function authenticate(request) {
  try {
    const token = extractToken(request);
    
    if (!token) {
      return {
        error: true,
        message: 'Authentication required. Please provide a valid token.',
        status: 401,
      };
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return {
        error: true,
        message: error.message || 'Invalid or expired token',
        status: 401,
      };
    }
    
    // Connect to database
    await connectDB();
    
    // Find user and check if active
    const user = await User.findById(decoded.userId)
      .select('+refreshToken')
      .populate('branchId', 'name code');
    
    if (!user) {
      return {
        error: true,
        message: 'User not found. Token may be invalid.',
        status: 401,
      };
    }
    
    if (!user.isActive) {
      return {
        error: true,
        message: 'Your account has been deactivated. Please contact administrator.',
        status: 403,
      };
    }

    // Get full name based on new schema
    const fullName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim();

    return {
      error: false,
      user: {
        userId: user._id.toString(),
        email: user.email,
        fullName: fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        branchId: user.branchId?._id?.toString() || user.branchId?.toString(),
        branchName: user.branchId?.name,
        permissions: user.adminProfile?.permissions || [],
        profilePhoto: user.profilePhoto?.url,
      },
      userDoc: user,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      error: true,
      message: error.message || 'Authentication failed',
      status: 401,
    };
  }
}

/**
 * Middleware to check if user has required role(s)
 * @param {string|string[]} allowedRoles - Single role or array of roles
 */
export function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return async (request, user) => {
    if (!user || !user.role) {
      return NextResponse.json(
        { success: false, message: 'User authentication required' },
        { status: 401 }
      );
    }
    
    if (!roles.includes(user.role)) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${user.role}` 
        },
        { status: 403 }
      );
    }
    
    return null; // No error, user has required role
  };
}

/**
 * Middleware to check if user has required permission(s)
 * @param {string|string[]} requiredPermissions - Single permission or array of permissions
 */
export function requirePermission(requiredPermissions) {
  const permissions = Array.isArray(requiredPermissions) 
    ? requiredPermissions 
    : [requiredPermissions];
  
  return async (request, user, userDoc) => {
    if (!user || !userDoc) {
      return NextResponse.json(
        { success: false, message: 'User authentication required' },
        { status: 401 }
      );
    }
    
    // Super admin has all permissions
    if (user.role === ROLES.SUPER_ADMIN) {
      return null;
    }
    
    // Check if user has at least one of the required permissions
    const hasPermission = permissions.some(perm => 
      userDoc.hasPermission(perm)
    );
    
    if (!hasPermission) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Access denied. Required permission(s): ${permissions.join(', ')}` 
        },
        { status: 403 }
      );
    }
    
    return null; // No error, user has permission
  };
}

/**
 * Check if user belongs to specific branch
 */
export function requireBranch(branchId) {
  return async (request, user) => {
    // Super admin can access all branches
    if (user.role === ROLES.SUPER_ADMIN) {
      return null;
    }
    
    if (!user.branchId || user.branchId !== branchId) {
      return NextResponse.json(
        { success: false, message: 'Access denied. You do not belong to this branch.' },
        { status: 403 }
      );
    }
    
    return null;
  };
}

  /**
   * Wrapper function to apply authentication middleware
   * Usage: withAuth(async (request, user, userDoc, context) => {...}, [middlewares])
   * Context includes params for dynamic routes in Next.js 15+
   */
  export function withAuth(handler, middlewares = []) {
    return async (request, context) => {
      // Authenticate user
      const auth = await authenticate(request);
    
      if (auth.error) {
        return NextResponse.json(
          { success: false, message: auth.message },
          { status: auth.status }
        );
      }
    
      // Apply additional middlewares
      for (const middleware of middlewares) {
        const result = await middleware(request, auth.user, auth.userDoc);
        if (result) {
          return result; // Middleware returned error response
        }
      }
    
      // Call the actual handler with context (params for dynamic routes)
      return handler(request, auth.user, auth.userDoc, context);
    };
  }

/**
 * Optional authentication - doesn't fail if token is missing
 */
export async function optionalAuth(request) {
  try {
    const token = extractToken(request);
    
    if (!token) {
      return { error: false, user: null };
    }
    
    return await authenticate(request);
  } catch (error) {
    return { error: false, user: null };
  }
}

export default {
  verifyToken,
  generateAccessToken,
  generateRefreshToken,
  authenticate,
  requireRole,
  requirePermission,
  requireBranch,
  withAuth,
  optionalAuth,
};
