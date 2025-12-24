import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import { ROLES } from '@/constants/roles';
import User from '@/backend/models/User';

export const POST = withAuth(async (request, user, userDoc, context) => {
  try {
    const { id } = await context.params;
    const { reason } = await request.json();

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    await connectDB();

    // Find and update the parent
    const parent = await User.findById(id);

    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    if (parent.role !== 'parent' || parent.status !== 'pending') {
      return NextResponse.json({ error: 'Invalid parent or already processed' }, { status: 400 });
    }

    // Update parent status to rejected
    parent.status = 'rejected';
    parent.approved = false;
    parent.isActive = false;
    parent.rejectionReason = reason;
    parent.rejectedAt = new Date();
    parent.rejectedBy = user.userId;
    await parent.save();

    // Email sending removed as per user request - only backend processing

    return NextResponse.json({
      success: true,
      message: 'Parent rejected successfully',
      parent: {
        _id: parent._id,
        fullName: parent.fullName,
        email: parent.email,
        status: parent.status,
        rejectedAt: parent.rejectedAt,
      }
    });

  } catch (error) {
    console.error('Error rejecting parent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, [requireRole(ROLES.SUPER_ADMIN)]);
