import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import { ROLES } from '@/constants/roles';
import User from '@/backend/models/User';
import connectDB from '@/lib/database';
import { deleteCache } from '@/lib/redis';

/**
 * GET /api/super-admin/admins/[id]
 * Get admin by ID
 */
export async function GET(request, { params }) {
  return withAuth(
    async (request, user) => {
      try {
        await connectDB();
        
        const { id } = await params;
        
        const admin = await User.findOne({ _id: id, role: ROLES.BRANCH_ADMIN })
          .populate('branchId', 'name code')
          .select('-passwordHash -refreshToken -resetPasswordToken');
        
        if (!admin) {
          return NextResponse.json(
            { success: false, message: 'Admin not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          data: admin,
        }, { status: 200 });
      } catch (error) {
        console.error('Get admin error:', error);
        return NextResponse.json(
          { success: false, message: error.message || 'Failed to fetch admin' },
          { status: 500 }
        );
      }
    },
    [requireRole(ROLES.SUPER_ADMIN)]
  )(request);
}

/**
 * PUT /api/super-admin/admins/[id]
 * Update admin
 */
export async function PUT(request, { params }) {
  return withAuth(
    async (request, user) => {
      try {
        await connectDB();
        
        const { id } = params;
        const body = await request.json();
        
        const allowedUpdates = ['fullName', 'phone', 'branchId', 'permissions', 'isActive'];
        const updates = {};
        
        allowedUpdates.forEach(field => {
          if (body[field] !== undefined) {
            updates[field] = body[field];
          }
        });
        
        const admin = await User.findOneAndUpdate(
          { _id: id, role: ROLES.BRANCH_ADMIN },
          updates,
          { new: true, runValidators: true }
        ).populate('branchId', 'name code').select('-passwordHash -refreshToken -resetPasswordToken');
        
        if (!admin) {
          return NextResponse.json(
            { success: false, message: 'Admin not found' },
            { status: 404 }
          );
        }
        
        // Clear cache
        await deleteCache(`user:${id}`);
        await deleteCache('users:*');
        
        return NextResponse.json({
          success: true,
          data: admin,
          message: 'Admin updated successfully',
        }, { status: 200 });
      } catch (error) {
        console.error('Update admin error:', error);
        return NextResponse.json(
          { success: false, message: error.message || 'Failed to update admin' },
          { status: 400 }
        );
      }
    },
    [requireRole(ROLES.SUPER_ADMIN)]
  )(request);
}

/**
 * DELETE /api/super-admin/admins/[id]
 * Delete admin
 */
export async function DELETE(request, { params }) {
  return withAuth(
    async (request, user) => {
      try {
        await connectDB();
        
        const { id } = params;
        
        const admin = await User.findOneAndDelete({ _id: id, role: ROLES.BRANCH_ADMIN });
        
        if (!admin) {
          return NextResponse.json(
            { success: false, message: 'Admin not found' },
            { status: 404 }
          );
        }
        
        // Clear cache
        await deleteCache(`user:${id}`);
        await deleteCache('users:*');
        
        return NextResponse.json({
          success: true,
          message: 'Admin deleted successfully',
        }, { status: 200 });
      } catch (error) {
        console.error('Delete admin error:', error);
        return NextResponse.json(
          { success: false, message: error.message || 'Failed to delete admin' },
          { status: 400 }
        );
      }
    },
    [requireRole(ROLES.SUPER_ADMIN)]
  )(request);
}
