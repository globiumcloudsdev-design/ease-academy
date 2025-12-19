import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import { ROLES } from '@/constants/roles';
import User from '@/backend/models/User';
import connectDB from '@/lib/database';
import { deleteCache } from '@/lib/redis';

/**
 * GET /api/super-admin/admins
 * Get all branch admins
 */
export async function GET(request) {
  return withAuth(
    async (request, user) => {
      try {
        await connectDB();
        
        const { searchParams } = new URL(request.url);
        
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const search = searchParams.get('search') || '';
        const branchId = searchParams.get('branchId');
        
        // Build query
        const query = { role: ROLES.BRANCH_ADMIN };
        
        if (search) {
          query.$or = [
            { fullName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ];
        }
        
        if (branchId) {
          query.branchId = branchId;
        }
        
        // Execute query
        const skip = (page - 1) * limit;
        
        const [admins, total] = await Promise.all([
          User.find(query)
            .populate('branchId', 'name code')
            .select('-passwordHash -refreshToken -resetPasswordToken')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
          User.countDocuments(query),
        ]);
        
        return NextResponse.json({
          success: true,
          data: admins,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        }, { status: 200 });
      } catch (error) {
        console.error('Get admins error:', error);
        return NextResponse.json(
          { success: false, message: error.message || 'Failed to fetch admins' },
          { status: 500 }
        );
      }
    },
    [requireRole(ROLES.SUPER_ADMIN)]
  )(request);
}

/**
 * POST /api/super-admin/admins
 * Create new branch admin
 */
export async function POST(request) {
  return withAuth(
    async (request, user) => {
      try {
        await connectDB();
        
        const body = await request.json();
        const { fullName, email, phone, password, branchId, permissions } = body;
        
        // Validate required fields
        if (!fullName || !email || !password || !branchId) {
          return NextResponse.json(
            { success: false, message: 'Full name, email, password, and branch are required' },
            { status: 400 }
          );
        }
        
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return NextResponse.json(
            { success: false, message: 'User with this email already exists' },
            { status: 400 }
          );
        }
        
        // Create admin user
        const admin = new User({
          fullName,
          email,
          phone,
          passwordHash: password,
          role: ROLES.BRANCH_ADMIN,
          branchId,
          permissions: permissions || [],
          isActive: true,
        });
        
        await admin.save();
        
        // Clear cache
        await deleteCache('users:*');
        
        return NextResponse.json({
          success: true,
          data: admin.toJSON(),
          message: 'Branch admin created successfully',
        }, { status: 201 });
      } catch (error) {
        console.error('Create admin error:', error);
        return NextResponse.json(
          { success: false, message: error.message || 'Failed to create admin' },
          { status: 400 }
        );
      }
    },
    [requireRole(ROLES.SUPER_ADMIN)]
  )(request);
}
